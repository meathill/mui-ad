# WIP - MVP-0 开发计划

> 最后更新：2026-04-14

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

### P0-2: 数据库层（packages/db）
- [ ] 定义 Drizzle schema（products、zones、ads、zone_ads、impressions、clicks）
- [ ] 生成 D1 迁移文件
- [ ] 编写 repository.ts（基础 CRUD）
- [ ] 编写 repository 单元测试

### P0-3: Worker 核心（apps/worker）
- [ ] Hono app 初始化 + 路由骨架
- [ ] 认证中间件（API Key 校验）
- [ ] REST API：zones CRUD
- [ ] REST API：products CRUD
- [ ] REST API：ads CRUD
- [ ] REST API：stats 查询
- [ ] 广告投放引擎（权重选择 + impression 记录）
- [ ] 点击追踪（click 记录 + 302 重定向）
- [ ] 编写 API 集成测试

### P0-4: MCP Server（apps/worker）
- [ ] MCP Server 初始化（SSE transport）
- [ ] 实现 `muiad_create_zone` tool
- [ ] 实现 `muiad_list_zones` tool
- [ ] 实现 `muiad_register_product` tool
- [ ] 实现 `muiad_create_ad` tool
- [ ] 实现 `muiad_list_ads` tool
- [ ] 实现 `muiad_get_zone_stats` tool
- [ ] 编写 MCP tool 单元测试

### P0-5: 前端 Widget（apps/worker）
- [ ] 广告渲染脚本 widget.js
- [ ] 支持多种广告位尺寸
- [ ] 异步加载，不阻塞页面

### P0-6: Admin Panel（apps/admin）
- [ ] Next.js + OpenNext 初始化
- [ ] 安装 Coss UI + Phosphor Icons
- [ ] Worker API 客户端（lib/api.ts）
- [ ] 概览页面
- [ ] 广告位管理页面（列表、创建、暂停/启用、嵌入代码）
- [ ] 产品管理页面
- [ ] 广告管理页面
- [ ] 数据统计页面

### P0-7: 部署与验证
- [ ] 部署 Worker 到 CF Workers
- [ ] 部署 Admin 到 CF Workers（OpenNext）
- [ ] 端到端测试：MCP 创建 → 页面渲染 → 计数
- [ ] 更新 README 部署说明

## 待定事项

- Landing Page（apps/web）内容设计，MVP-0 可后置
- Admin 是否需要登录认证（MVP-0 暂不做，依赖 Worker API Key）
