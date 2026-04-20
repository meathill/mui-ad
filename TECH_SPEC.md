# TECH_SPEC - MVP-0 技术规格

> 本文档约束 MVP-0 的开发，完成后合并到 DEV_NOTE.md
> 最后更新：2026-04-14

## 范围

MVP-0 只做单实例。不涉及网络通信、AI Agent、积分系统。

核心闭环：通过 MCP 创建广告位和广告 → 页面渲染广告 → 记录展示和点击。

## 语言与环境

| 项目 | 选择 |
|------|------|
| 语言 | TypeScript（strict mode） |
| 运行时 | Node.js >= 24 |
| 包管理 | pnpm |
| 项目结构 | monorepo（pnpm workspace） |

## 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| API 框架 | Hono | 轻量高性能，原生 CF Workers 支持 |
| Admin 面板 | Next.js 16.2 + React 19 | App Router，OpenNext 部署到 CF |
| Landing Page | Next.js 16.2 + React 19 | 宣传页面，静态为主 |
| 状态管理 | Zustand | 轻量，适合 Admin 场景 |
| CSS | TailwindCSS v4 | 统一栈，@theme 定义品牌 token |
| 组件库 | 自建（基于 Base UI primitives） | 按需 port / 自写，保品牌一致性，避免 shadcn 通用 neutral 风 |
| 图标库 | Phosphor Icons | 轻量、风格统一 |
| ORM | Drizzle ORM | 类型安全，CF D1 适配器成熟 |
| 数据库迁移 | wrangler d1 migrations | CF 原生迁移方案 |
| MCP transport | SSE | 成熟稳定，主流客户端已支持 |
| MCP SDK | @modelcontextprotocol/sdk | 官方 SDK，协议兼容性有保障 |
| 认证 | 静态 API Key | 最简方案，请求头 `Authorization: Bearer <key>` |
| 数据库 | D1 (SQLite) | CF 原生 |
| 缓存 | KV | 广告位配置缓存，减少 D1 查询 |
| 文件存储 | MVP-0 不使用 | 物料以 URL 形式存储 |
| 消息队列 | MVP-0 不使用 | 无异步任务需求 |
| 构建工具 | Vite | 用于 worker 项目 |
| 测试 | Vitest | 与 pnpm 生态配合 |
| 格式化 | Biome | lint + format |

## 部署模型

用户有两种使用方式：

```
方式 1：只部署 Worker（CLI + AI 控制）
┌─────────────────────────────────┐
│  Cloudflare Workers             │
│  ┌───────────────────────────┐  │
│  │  Hono Worker (muiad)      │  │
│  │  REST API + MCP + Widget  │  │
│  └───────────────────────────┘  │
│  D1 + KV                        │
└─────────────────────────────────┘
  ↑ MCP / CLI
  AI Agent (Cursor / Claude)

方式 2：部署 Worker + Admin（GUI 管理）
┌─────────────────────────────────┐
│  Cloudflare Workers             │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Hono      │  │ Next.js      │ │
│  │ Worker    │  │ Admin Panel  │ │
│  └──────────┘  └──────────────┘ │
│  D1 + KV                        │
└─────────────────────────────────┘
  ↑ REST API
  Admin Panel (浏览器)
```

## Monorepo 结构

```
muiad/
├── apps/
│   ├── worker/               Hono Worker（核心服务）
│   │   ├── src/
│   │   │   ├── index.ts          入口，Hono app
│   │   │   ├── routes/           路由定义
│   │   │   │   ├── api/          REST API 路由
│   │   │   │   ├── mcp.ts        MCP Server 端点
│   │   │   │   ├── serve.ts      广告渲染端点
│   │   │   │   └── track.ts      点击追踪端点
│   │   │   ├── modules/          业务模块
│   │   │   │   ├── ad-server/    广告投放引擎
│   │   │   │   └── tracker/      点击追踪
│   │   │   ├── mcp/
│   │   │   │   └── tools/        MCP Tool 实现（各独立文件）
│   │   │   └── middleware/       认证、限流等中间件
│   │   ├── public/
│   │   │   └── widget.js         广告渲染脚本（外部嵌入用）
│   │   ├── wrangler.jsonc
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── admin/                Next.js Admin Panel（GUI 管理）
│   │   ├── app/                 App Router
│   │   │   ├── (dashboard)/      管理页面组
│   │   │   │   ├── page.tsx          概览
│   │   │   │   ├── zones/            广告位管理
│   │   │   │   ├── products/         产品管理
│   │   │   │   ├── ads/              广告管理
│   │   │   │   └── stats/            数据统计
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   └── ui/              自建 UI 组件
│   │   ├── lib/
│   │   │   ├── api.ts           调用 Worker REST API 的客户端
│   │   │   └── stores/          Zustand stores
│   │   ├── wrangler.jsonc
│   │   ├── next.config.ts       含 OpenNext adapter
│   │   └── package.json
│   │
│   └── web/                  Next.js Landing Page（宣传站）
│       ├── app/
│       │   ├── page.tsx            首页
│       │   └── layout.tsx
│       ├── components/
│       │   └── ui/              自建 UI 组件
│       └── package.json
│
├── packages/
│   └── db/                   共享数据库层
│       ├── src/
│       │   ├── schema/          Drizzle schema 定义
│       │   │   ├── products.ts
│       │   │   ├── zones.ts
│       │   │   ├── ads.ts
│       │   │   ├── zone-ads.ts
│       │   │   ├── impressions.ts
│       │   │   ├── clicks.ts
│       │   │   └── index.ts      统一导出
│       │   ├── migrations/       D1 迁移文件
│       │   │   ├── 0001_init.sql
│       │   │   └── meta/
│       │   ├── repository.ts     数据访问层（CRUD）
│       │   └── types.ts          数据库相关类型
│       ├── drizzle.config.ts     Drizzle 配置（指向 D1）
│       └── package.json
│
├── pnpm-workspace.yaml
├── biome.json
├── vitest.config.ts
├── tsconfig.json
├── CLAUDE.md
├── TECH_SPEC.md
├── WIP.md
├── TODO.md
└── README.md
```

## Worker 路由设计（Hono）

```
/api/v1/zones              REST: 广告位 CRUD
/api/v1/ads                REST: 广告 CRUD
/api/v1/products           REST: 产品 CRUD
/api/v1/stats              REST: 统计数据
/mcp                       MCP Server 端点（SSE transport）
/serve                     广告渲染端点（widget 调用）
/track/click               点击追踪（302 重定向 + 计数）
/widget.js                 广告渲染脚本（静态文件）
```

认证规则：
- `/api/*`、`/mcp`：需要 `Authorization: Bearer <key>`
- `/serve`、`/track/*`、`/widget.js`：公开端点

## 环境变量规范

参考 [Next.js on Cloudflare Worker 最佳实践](https://meathill.com/posts/best-practice-for-nextjs-on-cloudflare-worker-2026)。

### Worker 环境变量（wrangler.jsonc）

```jsonc
{
  "main": "src/index.ts",
  "compatibility_date": "2026-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    { "binding": "DB", "database_name": "muiad-db", "database_id": "<id>" }
  ],
  "kv_namespaces": [
    { "binding": "CACHE", "id": "<id>" }
  ],
  "vars": {
    "MUIAD_URL": "https://my-mui-ad.example.com"
  },
  "secrets": ["MUIAD_API_KEY"]
}
```

### Admin 环境变量

```jsonc
{
  "vars": {
    "NEXT_PUBLIC_WORKER_URL": "https://my-mui-ad.example.com",
    "NEXT_PUBLIC_MUIAD_URL": "https://my-mui-ad.example.com"
  }
}
```

Admin 通过 `NEXT_PUBLIC_WORKER_URL` 调用 Worker 的 REST API。

### 本地开发

- Worker：`.dev.vars`（secrets，不提交 git）
- Admin：`.env` / `.env.development`（构建时变量）
- 用 `wrangler types` 生成类型定义

### 类型安全

```typescript
// worker/src/env.ts
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MUIAD_URL: string;
  MUIAD_API_KEY: string;
}
```

Hono 中通过 `c.env.DB` 访问类型安全的 bindings。

## 数据模型（Drizzle Schema）

Schema 定义在 `packages/db/src/schema/` 中，Worker 和 Admin 共用。

### products

```typescript
// packages/db/src/schema/products.ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:        text("name").notNull(),
  url:         text("url").notNull(),
  description: text("description"),
  createdAt:   text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### zones

```typescript
export const zones = sqliteTable("zones", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text("name").notNull(),
  siteUrl:   text("site_url").notNull(),
  width:     integer("width").notNull(),
  height:    integer("height").notNull(),
  status:    text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### ads

```typescript
export const ads = sqliteTable("ads", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id),
  title:     text("title").notNull(),
  content:   text("content"),
  imageUrl:  text("image_url"),
  linkUrl:   text("link_url").notNull(),
  weight:    integer("weight").notNull().default(1),
  status:    text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### zoneAds

```typescript
export const zoneAds = sqliteTable("zone_ads", {
  zoneId: text("zone_id").notNull().references(() => zones.id),
  adId:   text("ad_id").notNull().references(() => ads.id),
  weight: integer("weight").notNull().default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.zoneId, table.adId] }),
}));
```

### impressions

```typescript
export const impressions = sqliteTable("impressions", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  zoneId:    text("zone_id").notNull(),
  adId:      text("ad_id").notNull(),
  ipHash:    text("ip_hash").notNull(),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### clicks

```typescript
export const clicks = sqliteTable("clicks", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  zoneId:    text("zone_id").notNull(),
  adId:      text("ad_id").notNull(),
  ipHash:    text("ip_hash").notNull(),
  userAgent: text("user_agent"),
  referer:   text("referer"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### 迁移

```bash
# 生成迁移文件
cd packages/db
pnpm drizzle-kit generate

# 执行迁移（本地开发）
pnpm wrangler d1 migrations apply muiad-db --local

# 执行迁移（生产环境）
pnpm wrangler d1 migrations apply muiad-db --remote
```

迁移文件放在 `packages/db/src/migrations/` 中，Worker 部署时通过 wrangler 自动应用。

## MCP Tools 定义

### muiad_create_zone

```typescript
{
  name: "muiad_create_zone",
  description: "创建广告位",
  inputSchema: {
    type: "object",
    properties: {
      name:     { type: "string", description: "广告位名称" },
      site_url: { type: "string", description: "所属站点 URL" },
      width:    { type: "integer", description: "宽度（px）" },
      height:   { type: "integer", description: "高度（px）" },
    },
    required: ["name", "site_url", "width", "height"]
  }
}
// 返回：zone_id + widget 嵌入代码
```

### muiad_list_zones

```typescript
{
  name: "muiad_list_zones",
  description: "列出所有广告位",
  inputSchema: { type: "object", properties: {} }
}
// 返回：广告位列表（id、name、尺寸、状态、创建时间）
```

### muiad_register_product

```typescript
{
  name: "muiad_register_product",
  description: "注册产品",
  inputSchema: {
    type: "object",
    properties: {
      name:        { type: "string", description: "产品名称" },
      url:         { type: "string", description: "产品 URL" },
      description: { type: "string", description: "产品描述" },
    },
    required: ["name", "url"]
  }
}
// 返回：product_id
```

### muiad_create_ad

```typescript
{
  name: "muiad_create_ad",
  description: "创建广告",
  inputSchema: {
    type: "object",
    properties: {
      product_id: { type: "string", description: "关联产品 ID" },
      title:      { type: "string", description: "广告标题" },
      content:    { type: "string", description: "广告文案" },
      image_url:  { type: "string", description: "Banner 图片 URL" },
      link_url:   { type: "string", description: "落地页链接" },
      zone_ids:   { type: "array", items: { type: "string" }, description: "投放到的广告位 ID 列表" },
      weight:     { type: "integer", description: "权重，默认 1" },
    },
    required: ["product_id", "title", "link_url", "zone_ids"]
  }
}
// 返回：ad_id
```

### muiad_list_ads

```typescript
{
  name: "muiad_list_ads",
  description: "列出所有广告",
  inputSchema: { type: "object", properties: {} }
}
// 返回：广告列表（id、标题、关联产品、状态、权重）
```

### muiad_get_zone_stats

```typescript
{
  name: "muiad_get_zone_stats",
  description: "查看广告位统计数据",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: { type: "string", description: "广告位 ID" },
    },
    required: ["zone_id"]
  }
}
// 返回：展示量、点击量、CTR
```

## 广告投放逻辑

1. 外部站点嵌入 `<script src="https://my-mui-ad.example.com/widget.js" data-zone="zone_id" async></script>`
2. widget.js 请求 `/serve?zone=<zone_id>`
3. Worker 查询 zone_ads，获取该广告位下的所有活跃广告
4. 按权重随机选择一个广告
5. 记录 impression 到 D1
6. 返回广告 HTML（点击链接指向 `/track/click?ad=<ad_id>&zone=<zone_id>&redirect=<encoded_url>`）
7. 用户点击 → `/track/click` 记录 click → 302 重定向到广告落地页

## Admin Panel 页面（MVP-0 基础版）

| 页面 | 功能 |
|------|------|
| 概览 | 广告位数量、广告数量、今日展示/点击 |
| 广告位管理 | 列表、创建、暂停/启用、查看嵌入代码 |
| 产品管理 | 列表、创建、编辑 |
| 广告管理 | 列表、创建、暂停/启用 |
| 数据统计 | 按广告位查看展示量、点击量、CTR |

Admin 通过 REST API 调用 Worker，不直接访问 D1。

## 约束

- 单文件不超过 300 行
- 所有 MCP Tool 实现各自独立文件
- 数据访问层统一通过 `packages/db/repository.ts`，使用 Drizzle ORM，不直接写 SQL
- Worker 通过 Hono 的 `c.env` 访问 CF bindings（D1、KV），类型安全
- Admin 通过 REST API 与 Worker 通信，不直接访问 D1
- Schema 和迁移放在 `packages/db`，Worker 引用
- 测试覆盖：MCP Tool 单元测试 + 广告投放集成测试
- UI 组件自建：基于 `@base-ui-components/react` 原语，按 shadcn 方式放在
  `apps/admin/components/ui/`；沿用 ember / ink / paper / grass / danger
  设计 token，与 apps/web 视觉一致
