# 部署指南

MVP-0（landing / worker / admin）和用户体系 Phase A–D 都已上线。

## 线上地址

- Landing / Waitlist：https://muiad.meathill.com（主域名）
- Workers 默认域：https://muiad-web.meathill.workers.dev（兜底）
- API / MCP Server：https://api.muiad.meathill.com
  - REST：`/api/products|zones|ads|stats|ai-generations|api-keys|admin`
    —— 鉴权三路（见下）
  - Auth：`/auth/*`（better-auth handler）+ `/auth-meta`（signup 是否开放）
  - MCP：`POST /mcp`（JSON-RPC 2.0，Bearer root key 或 per-user key）
  - 公开：`/serve?zone=<id>`、`/track/{click,conversion}`、`/widget.js`
- Admin Panel：https://admin.muiad.meathill.com
  - 首访先进 `/setup` 填 Worker URL + root API key（存 localStorage）
  - 再进 `/signup`（仅首次）或 `/login` —— 走 session cookie
  - `/users`（admin）管账号；`/api-keys` 生成 MCP/CI 用的 per-user key；
    `/account` 改密码
  - robots `noindex, nofollow`

## API 鉴权三路

按优先级从高到低：

1. **better-auth session cookie**（admin 面板）
   - 跨子域 cookie（`.muiad.meathill.com`，`SameSite=None; Secure`）
   - 请求侧 fetch 必须 `credentials: 'include'`，响应侧必须 `Access-Control-Allow-Credentials: true`
2. **per-user API key**：`Authorization: Bearer muiad_<base64url 32B>`
   - 从 admin `/api-keys` 生成，原始 key 只显示一次
   - DB 只存 sha256 hash；命中后 `waitUntil` 异步更新 `last_used_at`
   - 所属 user 即数据归属（`owner_id` 过滤基准）
3. **root API key**：`Authorization: Bearer <KEY>`
   - CI / 运维 / 兜底用；跨用户可见（不按 owner 过滤）
   - 通过 `wrangler secret put MUIAD_API_KEY` 设置

## Cloudflare 资源

| 资源 | 用途 | 标识 |
| --- | --- | --- |
| Worker | `apps/web` OpenNext 产物 | `muiad-web` |
| Worker | `apps/worker` Hono REST + MCP | `muiad-api` |
| Worker | `apps/admin` Admin Panel (OpenNext) | `muiad-admin` |
| D1 | 业务库（waitlist / products / zones / ads / zone_ads / impressions / clicks / conversions / ai_generations / user / session / account / verification / api_keys） | `muiad` / `ca42d694-ebdb-4c62-984a-affa9d6fd891` |
| D1 | OpenNext tag cache | `tag-cache` / `5f26868d-5d24-4645-8954-a27168f6fcd6` |
| R2 | OpenNext 增量缓存 | `site-cache` |
| DO | OpenNext cache queue | `DOQueueHandler`（v1 migration） |
| Account | CF 账号 | `fdc63eeea83ae8f5234357308b9a638b` |

以上资源已存在且绑定在 `apps/web/wrangler.jsonc`，正常情况下无需重建。

## 日常部署命令（从仓库根目录）

```bash
# 1. 类型检查 + 构建（本地先过一遍）
pnpm --filter @muiad/web build

# 2. 本地 preview（可选，验证 OpenNext 产物）
pnpm --filter @muiad/web run db:migrate:local
pnpm --filter @muiad/web run preview

# 3. 远程 D1 迁移（有新 migration 时）
pnpm --filter @muiad/web run db:migrate:remote

# 4. 部署到 Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=fdc63eeea83ae8f5234357308b9a638b \
  pnpm --filter @muiad/web run deploy

# 4-备. 遇到 populate-cache OAuth 报错时的兜底：绕开 populate，直接 wrangler deploy
cd apps/web && pnpm exec opennextjs-cloudflare build && \
  CLOUDFLARE_ACCOUNT_ID=fdc63eeea83ae8f5234357308b9a638b pnpm exec wrangler deploy
```

> `deploy` 必须带 `CLOUDFLARE_ACCOUNT_ID`，否则 OpenNext 的 R2 cache populator 会弹交互式账号选择卡住。
>
> 若 `populate-cache` 抛 "You must be logged in to use wrangler dev in remote mode" / "logged in with an API Token"，用上面的兜底命令——`opennextjs-cloudflare build` 产出 `.open-next/worker.js` 后直接 `wrangler deploy`，跳过 populate。我们的落地页没有 ISR/SSG 缓存内容，跳过无副作用。
>
> CI（Cloudflare Workers Builds）的自动部署目前也会撞上同一个坑，暂未修——见 [DEV_NOTE.md](./DEV_NOTE.md)。

## Admin 部署（apps/admin）

```bash
cd apps/admin
CLOUDFLARE_ACCOUNT_ID=fdc63eeea83ae8f5234357308b9a638b pnpm run deploy
```

Admin 不用 R2 incremental cache（`open-next.config.ts` 空配置），不会撞上
`populate-cache` 的 OAuth 坑，直接 `pnpm run deploy` 就能过。

没用任何 Cloudflare 绑定（D1/KV/R2 都不需要）——Admin 所有数据都走 worker
REST API 取，Bearer key 存在访问者浏览器的 localStorage。

## Worker 部署（apps/worker）

```bash
cd apps/worker
# 首次 / 换 key 时（两个 secret 都要设）
printf '%s' "<root-api-key>"        | pnpm wrangler secret put MUIAD_API_KEY
printf '%s' "<better-auth-secret>"  | pnpm wrangler secret put BETTER_AUTH_SECRET
# 部署（不走 OpenNext，不需要 populate-cache 绕行）
CLOUDFLARE_ACCOUNT_ID=fdc63eeea83ae8f5234357308b9a638b pnpm run deploy
```

两个 secret 的用途：

- `MUIAD_API_KEY`：根凭据（兜底 / CI / 早期 MCP），用 `printf` 避免 `echo` 带换行
- `BETTER_AUTH_SECRET`：better-auth 签 session token 的 HMAC 密钥；丢了不会漏密码，但所有 session 立刻失效
- 生成：`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

密钥不要 commit 到 repo。`MUIAD_API_KEY` 需要给 admin 用时，第一次手动贴进
`/setup` 页，之后存在访问者浏览器的 localStorage。日常用户自己在 admin
`/api-keys` 生成的 per-user key 不经过这条路径。

## 初始化用户节点（只需一次）

部署完 worker 和 admin 后：

1. 访问 `https://admin.muiad.meathill.com/` → 进 `/setup` 填 Worker URL + `MUIAD_API_KEY`
2. 跳到 `/signup`（首次自动开放）→ 注册第一个账号（**自动成为 admin / owner**）
3. `/users` → 点"**认领孤儿数据**" → 把迁移前产生的无主数据（产品 / 广告位 /
   广告 / AI 生成）一次性归到你名下
4. `/api-keys` → 生成一个 `muiad_...` key 给 MCP / CI 用，复制走（只显示一次）
5. 后续新用户：admin 在 `/users` 直接建号（邮箱 + 初始密码）发给对方；对方登录
   后去 `/account` 改密码

之后 `/signup` 自动关闭；直接访问会显示"注册已关闭，去登录"。

## 端到端验证（部署后）

### Landing + Waitlist

```bash
curl -I https://muiad.meathill.com/

curl -X POST https://muiad.meathill.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'     # 期望 200；重复 409；非法 400

pnpm --filter @muiad/web exec wrangler d1 execute muiad --remote \
  --command "SELECT * FROM waitlist ORDER BY id DESC LIMIT 5"
```

### Worker REST + MCP

```bash
URL=https://api.muiad.meathill.com
AUTH="Authorization: Bearer $MUIAD_API_KEY"

# 根路由
curl "$URL/"                                     # {"name":"muiad-api","status":"ok"}
# 未带 bearer
curl -sI "$URL/api/zones"                        # HTTP 401
# 正常
curl -sH "$AUTH" "$URL/api/zones"                # {"zones":[...]}

# MCP handshake
curl -sX POST "$URL/mcp" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 完整闭环

用 MCP 工具调一圈，终端里走一遍：
`muiad_register_product` → `muiad_create_zone` → `muiad_create_ad` →
`GET /serve?zone=…` → `GET /track/click?...` → `muiad_get_zone_stats`。
预期：展示量 / 点击量 各 +1。

## MCP client 接入

> 推荐用 admin `/api-keys` 生成的 **per-user key**（`muiad_...`），MCP 创建的
> 数据会归到你账号下。`MUIAD_API_KEY` 也能用（跨用户可见），适合运维 / 多账号
> 聚合场景。下文的 `<KEY>` 代指这两类 key 中你选的那个。

### Claude Code

```bash
claude mcp add --transport http muiad https://api.muiad.meathill.com/mcp \
  --header "Authorization: Bearer <KEY>"
```

等价的 `~/.claude.json` / `.mcp.json` 写法：

```json
{
  "mcpServers": {
    "muiad": {
      "type": "http",
      "url": "https://api.muiad.meathill.com/mcp",
      "headers": { "Authorization": "Bearer <KEY>" }
    }
  }
}
```

GUI 的 "Connectors" 面板只能走 OAuth 流，我们的 MCP Server 用静态 Bearer，所以不要在那里加——走 CLI 或直接改配置。

提示：MCP 当前还没做 per-user 归属（用 `muiad_...` 虽然能跑，但创建的数据
`owner_id` 仍是 NULL；这是 WIP.md 里留的坑，下次迭代处理）。

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "muiad": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://api.muiad.meathill.com/mcp",
        "--header", "Authorization:Bearer <KEY>",
        "--transport", "http-only"
      ]
    }
  }
}
```

`mcp-remote` 把远程 HTTP MCP 桥接成 Claude Desktop 需要的 stdio 形态；
`--transport http-only` 关 SSE 订阅，匹配我们这套只用 POST 的实现。

### Cursor

Settings → MCP → Add new MCP server：

```json
{
  "mcpServers": {
    "muiad": {
      "url": "https://api.muiad.meathill.com/mcp",
      "headers": { "Authorization": "Bearer <KEY>" }
    }
  }
}
```

Cursor 原生支持 HTTP MCP，不用 bridge。

### 自部署节点

把 URL 换成你自己的 worker 域名，key 换成 `MUIAD_API_KEY` 的值即可。

## 已知事项

- Waitlist 接口目前没有速率限制，如遭遇滥用需要补 middleware
- Cloudflare Workers Builds 的 CI 自动部署暂时跑不通（`populate-cache` 认证问题），手动部署可用
