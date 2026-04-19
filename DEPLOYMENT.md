# 部署指南

MVP-0 的 landing page 和 Worker（REST + MCP + serve + track + widget）都已上线。Admin 面板还没做。

## 线上地址

- Landing / Waitlist：https://muiad.meathill.com（主域名）
- Workers 默认域：https://muiad-web.meathill.workers.dev（兜底）
- API / MCP Server：https://api.muiad.meathill.com
  - REST：`/api/products|zones|ads|stats`（`Authorization: Bearer <MUIAD_API_KEY>`）
  - MCP：`POST /mcp`（JSON-RPC 2.0，同样走 Bearer）
  - 公开：`/serve?zone=<id>`、`/track/click`、`/widget.js`

## Cloudflare 资源

| 资源 | 用途 | 标识 |
| --- | --- | --- |
| Worker | `apps/web` OpenNext 产物 | `muiad-web` |
| Worker | `apps/worker` Hono REST + MCP | `muiad-api` |
| D1 | 业务库（waitlist + products/zones/ads/zone_ads/impressions/clicks） | `muiad` / `ca42d694-ebdb-4c62-984a-affa9d6fd891` |
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

## Worker 部署（apps/worker）

```bash
cd apps/worker
# 首次 / 换 key 时
echo "<your-key>" | pnpm wrangler secret put MUIAD_API_KEY
# 部署（不走 OpenNext，不需要 populate-cache 绕行）
CLOUDFLARE_ACCOUNT_ID=fdc63eeea83ae8f5234357308b9a638b pnpm run deploy
```

当前生产密钥：`muimui`（临时，压测完要换成强密钥）。

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
        "--header", "Authorization:Bearer <MUIAD_API_KEY>",
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
      "headers": { "Authorization": "Bearer <MUIAD_API_KEY>" }
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
