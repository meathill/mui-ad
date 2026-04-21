# 开发笔记

长期积累的技术决策、踩坑记录、环境约定。不记录"做了什么"，只记录"为什么这么做"以及以后要重复关注的事。

## 技术决策

### Landing page 用 OpenNext 跑在 Cloudflare Workers
- **依据**：整个产品（Worker、MCP、Admin）都在 CF，landing 不单独起 Vercel / Netlify 降低心智成本，并且能复用同一个 D1 实例收 waitlist
- **代价**：OpenNext 对 Next.js 新版本有延迟；每次 Next 大版本升级都要检查 `@opennextjs/cloudflare` 兼容性

### 图标库用 `@phosphor-icons/react`，不是 `phosphor-react`
- **原因**：`phosphor-react@1.x` 在 React 19 + RSC 下会抛 `createContext is not a function`（老包是 UMD/CJS，模块顶层调 `React.createContext`，RSC 打包器不吃）
- **结论**：项目内一律用 `@phosphor-icons/react`；layout 这种服务端组件从 `@phosphor-icons/react/dist/ssr` 导入 SSR 版本

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

## 待长期关注

- **waitlist 速率限制**：线上目前裸奔，上量后会被扫。要加 IP / 时间窗 middleware，或走 Turnstile
- **`NEXT_PUBLIC_SITE_URL` 漂移**：换正式域名时 wrangler.jsonc 里 `vars` 要同步更新
- **OpenNext DO 警告**：部署日志里 workerd 会打 `DOQueueHandler` 未导出的 warning——这是 OpenNext 内部约定，未来版本可能变成 startup error，升级时留意
