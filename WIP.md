# WIP - 当前状态

> 中短期施工台。只记现在进行中 + 下一步，不写历史。
> 最后更新：2026-09-06（维护轮清理：MVP-0/1/2 明细归档到 git 历史，见 `git log --oneline`）

## 已上线（v1 public beta）

- MVP-0：单实例投放 + MCP + widget 渲染
- MVP-1：归因追踪（referer/UTM/session 去重/conversion 回链/admin 可视化）
- MVP-2：13 个 MCP tool + 跨用户市场 + 4 档审批（auto/manual/warm/ai）+ Workers AI 审核 + 素材托管 `muiad_upload_asset` + 反馈闭环
- Auth：better-auth + session / per-user key / root key 三路 + `/users` 建号 + 孤儿认领
- Admin：CRUD + approvals + api-keys + AI banner composer（BYOK）
- Landing：`muiad.meathill.com` + admin `admin.muiad.meathill.com` + API `api.muiad.meathill.com`

## 进行中

- （空：下一轮从 TODO.md 的 MVP-3 里领任务）

## 下一步（来自 TODO）

1. MVP-3 节点发现与节点间直传设计
2. waitlist 速率限制（线上裸奔，先补再上量）
