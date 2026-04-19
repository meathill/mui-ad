# 部署指南

当前仅落地页（`apps/web`）已部署。Worker（REST + MCP）、Admin、Widget 待 MVP-0 后续任务完成后再上线。

## 线上地址

- Landing / Waitlist：https://muiad-web.meathill.workers.dev
- 自定义域名 `muiad.dev`：未接入（DNS/绑域名后续处理）

## Cloudflare 资源

| 资源 | 用途 | 标识 |
| --- | --- | --- |
| Worker | `apps/web` OpenNext 产物 | `muiad-web` |
| D1 | 业务库（含 `waitlist` 表） | `muiad` / `ca42d694-ebdb-4c62-984a-affa9d6fd891` |
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
```

> 必须带 `CLOUDFLARE_ACCOUNT_ID`，否则 OpenNext 的 R2 cache populator 会弹交互式账号选择卡住。

## 端到端验证（部署后）

```bash
# 首页
curl -I https://muiad-web.meathill.workers.dev/

# waitlist
curl -X POST https://muiad-web.meathill.workers.dev/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'     # 期望 200
# 再发一次 → 409
# 无效邮箱 → 400

# 查 waitlist 落库
pnpm --filter @muiad/web exec wrangler d1 execute muiad --remote \
  --command "SELECT * FROM waitlist ORDER BY id DESC LIMIT 5"
```

## 已知事项

- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ASSETS_URL` 仍为 `https://muiad.dev`，在 workers.dev 阶段 sitemap/OG 会指到一个未生效的域名——绑域名之前影响仅限 SEO / 社交分享预览
- `wrangler.jsonc` 没有显式写 `workers_dev: true`，首次部署默认开启 workers.dev 路由；绑正式域名后可改为 `false`
- Waitlist 接口目前没有速率限制，如遭遇滥用需要补 middleware
