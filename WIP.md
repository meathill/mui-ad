# WIP - MVP-0 开发计划

> 最后更新：2026-04-21

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
  （放弃 Coss UI 方案，UI 组件自建基于 Base UI，保品牌一致）
- [x] Worker API 客户端 `lib/api.ts`（Bearer、统一错误、typed via `@muiad/db`）
- [x] 配置管理 `lib/store.ts`（Zustand + localStorage 持久化）+ `RequireKey` 守卫
- [x] `/setup` 首次配置页（校验 URL + key，连不上直接报错）
- [x] 概览页（zones / products / ads 总数 + quick start 入口）
- [x] 广告位管理（列表、创建带尺寸预设、暂停/启用、复制嵌入代码）
- [x] 产品管理页面（列表 / 登记 / 编辑 / 删除）
- [x] 广告管理页面（列表 / 创建含产品选择 + 广告位多选 / 编辑含
      暂停/启用 + zone 差分挂/卸 / 删除确认）
- [ ] 数据统计页面（阶段 3，考虑进 zone 详情或单独页）
- [x] 部署到 CF Workers：https://muiad-admin.meathill.workers.dev
- [ ] 绑 admin.muiad.meathill.com 自定义域名（可选）

### P0-7: 部署与验证
- [x] 部署 Worker 到 CF Workers（`muiad-api` → `api.muiad.meathill.com`）
- [ ] 部署 Admin 到 CF Workers（OpenNext）——P0-6 做完再上
- [x] 端到端测试：MCP register/create_zone/create_ad → /serve → /track/click → stats
      线上全通（1 impression / 1 click / 100% CTR）
- [x] 更新 DEPLOYMENT.md（worker 部署命令 + 资源表 + API URL）

## MVP-1 归因追踪（进行中）

- [x] **1a** 基础归因字段（已上线）
      - `impressions` 加 `referer`（host 页面 URL）
      - `clicks` 加 `utm_source / utm_medium / utm_campaign`
      - `/serve` 记录 referer；`/track/click` 从 redirect URL 解析 UTM 持久化
      - migration 0003 已应用到本地 + 远程 muiad D1
- [ ] **1b** Session 化去重（cookie id 替代裸 IP hash）
- [x] **1c** `/track/conversion` 端点 + `conversions` 表 + MCP tool
      - `/track/click` redirect 时 append `?muiad_click=<id>`，形成 click → conversion 回链
      - POST `/track/conversion` 公开（CORS）接受 `{click_id | ad_id, event_type, value?, currency?, meta?}`
      - click_id 提供时自动 infer ad/zone；value 以整型最小单位存
      - MCP 新 tool `muiad_get_ad_conversions`，按事件类型聚合 count + value
      - worker 42 测试全绿；线上验证链路通
- [x] **1d** Admin 归因可视化（去重切换推到 1b 完成后做）
      - 新 repo 查询：utmSourcesForZone / topReferersForZone / conversionsByAdInZone
      - worker 新端点 `GET /api/stats/zones/:id/breakdown` + `GET /api/stats/ads/:id/conversions`
      - admin 新页 `/zones/[id]/stats`：大号卡片展示 展示/点击/CTR，UTM 来源带进度条，
        referer 列表，转化按广告聚合
      - zones 列表的"数据"列整块变 link 点进去
      - 线上 landing zone 实时数据：27 展示 / 5 点击 / 18.5% CTR / 1 signup

## 用户体系 Phase A–D ✅（已上线）

2026-04-21 完成；workers 已部署，D1 migration 0006-0009 已 apply 到本地 + 远程。

- **Phase A**：引入 better-auth（email + password），`/auth/*` 挂 worker；admin
  DashboardLayout 套 `RequireSession`。migration 0006。
- **Phase B**：better-auth admin plugin；第一个注册的人自动 admin（第二个起
  `/signup` 自动关闭），后续新账号由 admin 在 `/users` 直接建（邮箱 + 初始密码发
  给用户，用户登录后去 `/account` 改密码）。不做邀请码。migration 0007。
- **Phase C**：`products / zones / ads / ai_generations` 加 `owner_id`，repo 层
  按 ownerId 过滤，session → user；root key / MCP → 跨用户。
  `/api/admin/claim-orphans` 一键把 owner_id IS NULL 的历史数据认领到当前用户。
  migration 0008。
- **Phase D**：per-user API keys。`muiad_<base64url 32B>` 原始 key 只在生成时
  返回一次，DB 只存 sha256 hash。中间件鉴权顺序：session > `muiad_*` key >
  `MUIAD_API_KEY`。`/api-keys` 页生成 / 列出 / 撤销，命中时 `waitUntil` 异步更新
  `last_used_at`。migration 0009。

## 待定事项

- 自定义域名 `muiad.dev` 接入：待 DNS 迁至 CF 后，dashboard 加 Custom Domain，
  同时把 `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ASSETS_URL` 的值校准
- MCP tool 目前仍用 root key 鉴权，下游 handler 在 root 模式下写入时 owner_id
  为 NULL；要不要把 MCP 也迁到 per-user key、让 MCP 创建的数据自动归属用户，
  等下次迭代决定（对 CI / 多实例节点编排有影响）
