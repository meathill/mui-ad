# WIP - MVP-0 开发计划

> 最后更新：2026-04-19

## 已上线

- Landing Page（`apps/web`）已部署到 Cloudflare Workers：
  https://muiad-web.meathill.workers.dev
- D1 `muiad` 的 `waitlist` 表已在线上，接口端到端打通（200 / 409 / 400）
- 部署命令与资源清单见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 目标

跑通最小闭环：单实例广告投放 + MCP 接入 + 广告渲染。

交付标准：AI Agent 通过 MCP 创建广告位和广告，页面能正确渲染广告并计数。

## 任务分解

### P0-0: 确定技术规格
- [x] 编写 TECH_SPEC.md，约束 MVP-0 的开发

### P0-1: Monorepo 初始化
- [ ] 初始化 pnpm workspace
- [ ] 创建 `packages/db`（Drizzle ORM + D1 迁移）
- [ ] 创建 `apps/worker`（Hono + Vite + wrangler）
- [ ] 创建 `apps/admin`（Next.js 16.2 + OpenNext）
- [ ] 创建 `apps/web`（Next.js 16.2 Landing Page）
- [ ] 配置 biome（格式化 + lint）
- [ ] 配置 vitest
- [ ] 配置 tsconfig（strict mode，workspace 引用）

### P0-2: 数据库层（packages/db）✅
- [x] 定义 Drizzle schema（products、zones、ads、zone_ads、impressions、clicks + waitlist）
- [x] 编写 D1 迁移文件（手写 `0002_business_tables.sql`，含索引；waitlist 的 `0001_init.sql` 从 apps/web 搬过来）
- [x] 按领域拆 repository：`src/repository/{products,zones,ads,stats}.ts`，纯函数 + Drizzle
- [x] 本地 libsql in-memory 起 vitest，13 个测试全过
- [x] 本地 + 远程 `muiad` D1 都 apply 完 0002
- 已知：apps/web 的 `wrangler.jsonc` 把 `migrations_dir` 指到 `packages/db/src/migrations` 统一管理

### P0-3: Worker 核心（apps/worker）✅
- [x] Hono app 初始化 + 路由骨架（入口在 `src/index.ts`）
- [x] Bearer 认证中间件（`MUIAD_API_KEY`，走 `Authorization: Bearer <key>`）
- [x] REST API：zones / products / ads / stats 全 CRUD，zones 创建时返回嵌入代码
- [x] 广告投放引擎：`modules/ad-server/pick.ts` 加权随机 + impression 记录
- [x] 点击追踪：`/track/click` 落库 + 302 重定向
- [x] `/widget.js` 内联返回，负责抓取 `/serve` 并渲染广告
- [x] vitest 集成测试：17 个用例全绿（auth / 三类 CRUD / serve / track / widget / pick）
- 未部署：等 P0-4 MCP 做完一起上，需要 `wrangler secret put MUIAD_API_KEY`

### P0-4: MCP Server（apps/worker）✅
- [x] MCP Server 走 JSON-RPC 2.0 over HTTP（放弃 SDK 自带的 Node 形状 transport，
  Workers 的 Fetch API 直接承载）
- [x] 6 个 `muiad_*` tool 各自单文件：create_zone / list_zones / register_product
  / create_ad / list_ads / get_zone_stats
- [x] `src/mcp/server.ts` dispatcher 处理 initialize / ping / notifications /
  tools/list / tools/call
- [x] `/mcp` 挂在 bearer 之后
- [x] 8 个 MCP 测试（transport + tools/list + 端到端 tool chain），加上原有 17
  个，worker 25 测试全绿

### P0-5: 前端 Widget（apps/worker）
- [ ] 广告渲染脚本 widget.js
- [ ] 支持多种广告位尺寸
- [ ] 异步加载，不阻塞页面

### P0-6: Admin Panel（apps/admin）
- [x] Next.js 16 + OpenNext 对齐 apps/web 的 Tailwind v4 + editorial 风格
  （跳过 Coss UI，直接用 Tailwind + Phosphor 保持栈最小）
- [x] Worker API 客户端 `lib/api.ts`（Bearer、统一错误、typed via `@muiad/db`）
- [x] 配置管理 `lib/store.ts`（Zustand + localStorage 持久化）+ `RequireKey` 守卫
- [x] `/setup` 首次配置页（校验 URL + key，连不上直接报错）
- [x] 概览页（zones / products / ads 总数 + quick start 入口）
- [x] 广告位管理（列表、创建带尺寸预设、暂停/启用、复制嵌入代码）
- [ ] 产品管理页面（阶段 2）
- [ ] 广告管理页面（阶段 2）
- [ ] 数据统计页面（阶段 3，考虑进 zone 详情或单独页）
- [x] 部署到 CF Workers：https://muiad-admin.meathill.workers.dev
- [ ] 绑 admin.muiad.meathill.com 自定义域名（可选）

### P0-7: 部署与验证
- [x] 部署 Worker 到 CF Workers（`muiad-api` → `api.muiad.meathill.com`）
- [ ] 部署 Admin 到 CF Workers（OpenNext）——P0-6 做完再上
- [x] 端到端测试：MCP register/create_zone/create_ad → /serve → /track/click → stats
      线上全通（1 impression / 1 click / 100% CTR）
- [x] 更新 DEPLOYMENT.md（worker 部署命令 + 资源表 + API URL）

## 待定事项

- Admin 是否需要登录认证（MVP-0 暂不做，依赖 Worker API Key）
- 自定义域名 `muiad.dev` 接入：待 DNS 迁至 CF 后，dashboard 加 Custom Domain，
  同时把 `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ASSETS_URL` 的值校准
