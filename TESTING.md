# 测试指南

> 本文档说明如何运行测试、测试如何组织、覆盖率要求。面向新加入的开发者与 AI Agent。

## 运行

```bash
# 全量（db + worker + admin，web 暂无单测）
pnpm --filter @muiad/db test
pnpm --filter @muiad/worker test
pnpm --filter @muiad/admin test

# 监听模式
pnpm --filter @muiad/db run test:watch
pnpm --filter @muiad/worker run test:watch
pnpm --filter @muiad/admin run test:watch
```

框架一律 `vitest run`。根 `vitest.config.ts` 只定 `globals + node` 环境，各包自带 `vitest.config.ts`（worker/db/admin；admin 的 `include` 限定 `lib/**/*.test.ts`，只测纯函数不碰 DOM）。

## 组织与约定

- 测试与被测代码同包：`packages/db/tests/*.test.ts`、`apps/worker/tests/*.test.ts`、`apps/admin/lib/**/*.test.ts`，命名 `*.test.ts`
- db 测试：`tests/helpers.ts` 的 `createTestDb()` 起 libsql 内存库，每用例 `beforeEach` 新库，纯函数 + Drizzle repository 直测
- worker 测试：`tests/helpers.ts` 的 `makeEnv()/app.request()` 调 Hono app，不起真实 server；鉴权用 `authed()` 带 Bearer，覆盖 401/403/200
- 用例名写场景不写实现（如 `rejects missing bearer`），一个 `it` 只断言一个行为
- 不测框架内部，不为类型系统已保证的东西写测试，不过度 mock（边界 mock 即可）

## 覆盖率要求（优先级）

1. 纯函数与 repository：目标 100%（`packages/db/src/repository/*`、`worker/src/lib/*` 如 moderation/assets/hash）
2. API 路由：目标 100%（每个端点的鉴权 + 正常 + 校验失败 + 跨用户拒绝）
3. MCP tools：端到端 chain（register → create_zone → create_ad → serve/track/stats）
4. UI（admin/web）：admin 只测 `lib/` 纯函数（providers/format），组件与 web 暂不强制
5. E2E：部署后按 DEPLOYMENT.md「端到端验证」手动跑一遍

## 已知缺口（维护轮记录）

- `moderation.ts` fail-closed 矩阵、`assets.ts` 纯函数、`user-settings/users` repository、`stats breakdown`、`settings/approvals` API 专测已在本轮补齐（见对应测试文件）
