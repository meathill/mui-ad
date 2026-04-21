# 开发笔记

长期积累的技术决策、踩坑记录、环境约定。不记录"做了什么"，只记录"为什么这么做"以及以后要重复关注的事。

## 技术决策

### 用户体系用 better-auth + admin plugin，不自己造
- **依据**：better-auth 的 drizzleAdapter 和 SQLite schema 正好能对得上 D1；
  admin plugin 自带 listUsers / createUser / removeUser / setUserPassword，省了一
  整层用户管理代码
- **没选 Clerk / Auth0 / Supabase Auth**：都要外部依赖或托管账号，违背"自托管
  为先"的定位。better-auth 完全跑在 worker 内，数据全在你自己的 D1
- **没有邀请码机制**：最初想做 invite table + token，和 owner 沟通后简化为"admin
  直接建号设初始密码发给用户，用户登录后 `/account` 改密码"。少一张表，交互也更直白
- **第一个注册的人自动 admin**：在 `databaseHooks.user.create.before` 里数 user
  表，count === 0 时写 `role: 'admin'`，其余写 `user`；之后 worker 拦
  `/auth/sign-up/email` 在非空时直接 403。前端也根据 `/auth-meta` 隐藏 `/signup`

### 鉴权三路并存：session > per-user API key > MUIAD_API_KEY
- **场景分离**：
  - admin 面板走 session cookie（跨子域 `.muiad.meathill.com`、`SameSite=None; Secure`）
  - MCP / CI / 脚本走 `Bearer muiad_...` per-user key
  - 运维 / 救命场景走 `Bearer <MUIAD_API_KEY>` 作为根凭据兜底
- **顺序优先 session**：admin 同时带 Bearer 根 key + cookie 时必须按 session 做
  owner 过滤，否则 root key 一刀切就把多用户隔离废了
- **`muiad_` 前缀命中后不 fall-through**：用户 key 过期 / 撤销时直接 401，
  避免错位"降级"成 root key 造成权限放大
- **API key 只存 sha256 hash + 可读 prefix**：明文原 key 只在创建接口返回一次，
  UI 负责让用户复制走，刷新就再也拿不到了；符合最小权限 + 可撤销的 API key 常识

### 跨子域 cookie
- `admin.muiad.meathill.com` 和 `api.muiad.meathill.com` 同属 `.muiad.meathill.com`
- better-auth 的 `advanced.defaultCookieAttributes = { sameSite: 'none', secure: true, domain: '.muiad.meathill.com' }`
  + `crossSubDomainCookies.enabled = true`
- 后端 CORS 必须 `credentials: true` + 回显 origin（不能用 `*`）；前端 fetch 必须
  `credentials: 'include'`

### `owner_id` 允许 NULL + 认领机制
- **为什么 nullable**：migration 0008 执行时用户表可能还空（Phase C 迁移在 Phase B 之前
  部署），硬写 NOT NULL 会失败；允许 NULL + 迁移里带 `UPDATE ... WHERE owner_id IS NULL`
  的 backfill 更鲁棒
- **NULL 数据对用户不可见**：repository 在 ownerId !== undefined 时按 eq 过滤，
  IS NULL 不会匹配任何已登录用户；只有 root key 模式能看到孤儿数据
- **`/api/admin/claim-orphans`**：admin 登录后一键认领，幂等（第二次调返回 0）
- **MCP 写入仍会产生新的 NULL 数据**：MCP 当前用 root key 鉴权，没有用户上下文；
  未来 MCP 走 per-user key 后这个问题自动消失

### Landing page 用 OpenNext 跑在 Cloudflare Workers
- **依据**：整个产品（Worker、MCP、Admin）都在 CF，landing 不单独起 Vercel / Netlify 降低心智成本，并且能复用同一个 D1 实例收 waitlist
- **代价**：OpenNext 对 Next.js 新版本有延迟；每次 Next 大版本升级都要检查 `@opennextjs/cloudflare` 兼容性

### 图标库用 `@phosphor-icons/react`，不是 `phosphor-react`
- **原因**：`phosphor-react@1.x` 在 React 19 + RSC 下会抛 `createContext is not a function`（老包是 UMD/CJS，模块顶层调 `React.createContext`，RSC 打包器不吃）
- **结论**：项目内一律用 `@phosphor-icons/react`；layout 这种服务端组件从 `@phosphor-icons/react/dist/ssr` 导入 SSR 版本

### AI banner 生成走 BYOK + 浏览器直连，不经服务端
- **决策**：admin `/settings` 存用户自己的 OpenAI / Google API key（localStorage），
  生成 banner 时浏览器直接调 provider。worker 只落库 `ai_generations`，不持有 LLM key
- **为什么**：LLM 费用不兜底，用户用自己的 quota 最直接；worker 也不用扛费用监控和
  滥用防护。DEV 历史上曾让 worker 调 OpenAI，后来完整拆掉（`9a5c154` 架构改造 step 1）
- **扩展 provider 模式**：`apps/admin/lib/providers/{openai,google,...}.ts` 实现
  `ImageProvider` 接口；新 provider 只需加一个文件 + 注册进 `index.ts`

### 归因链：impression → click → conversion 用 sid cookie 串起来
- **`muiad_sid`** cookie（`/serve` 首次访问下发，HttpOnly/Secure/SameSite=None、30 天）
  是 embed 场景唯一能跨第三方 iframe 持久化的身份；配合 `COUNT(DISTINCT session_id)`
  算 uniqueViewers / uniqueClickers
- **`muiad_click=<id>`**：`/track/click` 302 时 append 到 redirect URL 的 query，
  让 advertiser 的落地页 JS 能把这个 ID 回传给 `/track/conversion`；server 侧看到
  click_id 就能自动 infer ad/zone
- **conversion `value` 用整型最小单位**（cents / 分），不存浮点，避免币种汇总时精度漂

### 共享 DB 包走 workspace 协议 `@muiad/db`
- `packages/db` 由 worker / admin 两个 app 共用；schema / repository / migration 都
  在这里，app 通过 `"@muiad/db": "workspace:*"` 引用，不要复制粘贴
- **migration 的权威目录是 `packages/db/src/migrations`**；wrangler.jsonc 的
  `migrations_dir` 全部指向这里，不要在 app 里另建 migrations 目录

### Tailwind v4 必须显式装 PostCSS 插件
- **坑**：v4 不再随 `tailwindcss` 默认自动注入 PostCSS 流程
- **配置**：`pnpm add -D @tailwindcss/postcss` + 一个 `postcss.config.mjs`（见 `apps/web/postcss.config.mjs`）
- **CSS 入口**用 `@import "tailwindcss";`（不是 v3 的 `@tailwind base/components/utilities`）
- **自定义 token**在 CSS 里 `@theme { --color-xxx: ...; }` 定义，自动生成 `bg-xxx / text-xxx` 工具类

## 部署约定

### 每次部署前必过

```bash
pnpm run format         # biome 格式化
pnpm --filter @muiad/web build  # next build 过类型检查
```

### `wrangler secret put` 不要用 `echo` 管道上传
- `echo "key"` 末尾带 `\n`，wrangler 会把它当 secret 的一部分存起来
- 结果：bearer header 要带 `\n` 才 match，正常的 `Authorization: Bearer <key>` 全部 401
- 正确姿势：`printf '%s' "<key>" | pnpm wrangler secret put MUIAD_API_KEY`
- 或者交互式输入（wrangler 会正确处理换行）

### `.dev.vars` 必须 gitignored
- wrangler 的 per-worker 本地开发 secret 文件，约定放在各 worker 根目录
- 已在 `.gitignore` 加 `**/.dev.vars`
- 历史教训：MVP-1a commit 时误带了 `apps/worker/.dev.vars`（含 API key），force-push
  后 rotate 了 key 补救——commit 前看 `git status` 是便宜但重要的一步

### 跑 `opennextjs-cloudflare deploy` 必须设 `CLOUDFLARE_ACCOUNT_ID`
- 否则 R2 cache populator 会弹交互式账号选择阻塞
- 我们的账号：`fdc63eeea83ae8f5234357308b9a638b`

### `opennextjs-cloudflare deploy` 的 populate-cache 步骤偶发认证失败
- **现象**：抛 `You must be logged in to use wrangler dev in remote mode` 或 `logged in with an API Token. Unset the CLOUDFLARE_API_TOKEN`，CI 里稳定复现，本地偶发
- **根因**：populate-cache 内部调 `wrangler dev --remote` 做 R2 provisioning，这条路径对 API token 不认，只走 OAuth
- **兜底**：直接用 `opennextjs-cloudflare build && wrangler deploy` 绕开 populate。落地页无 ISR 内容，跳过 populate 无副作用
- **未解**：CI（Cloudflare Workers Builds）自动部署目前跑不通，先手动部署，等 OpenNext 修掉这个行为再回来接

### Wrangler 的 D1 migration 目录默认 `./migrations`
- `apps/web/migrations/NNNN_*.sql` 是权威来源；命令 `pnpm run db:migrate:remote`
- 如果 "No migrations to apply" 说明已经 apply 过，直接继续

## Auth 调试 checklist

- session 不生效 → 先查 CORS：`Access-Control-Allow-Credentials: true` + 具体 origin
  （不是 `*`），fetch 侧 `credentials: 'include'`
- `/auth-meta` 返回 `signupOpen: false` 但应用里没用户 → 检查是不是有残留的
  smoke-test 用户，`SELECT * FROM user;` 看一眼
- Bearer `muiad_...` 401 → 先确认 key 没被撤销（`revoked_at IS NULL`），
  再 `select hash from api_keys` 和 `echo -n "$KEY" | shasum -a 256` 比对

## 待长期关注

- **waitlist 速率限制**：线上目前裸奔，上量后会被扫。要加 IP / 时间窗 middleware，或走 Turnstile
- **`NEXT_PUBLIC_SITE_URL` 漂移**：换正式域名时 wrangler.jsonc 里 `vars` 要同步更新
- **OpenNext DO 警告**：部署日志里 workerd 会打 `DOQueueHandler` 未导出的 warning——这是 OpenNext 内部约定，未来版本可能变成 startup error，升级时留意
