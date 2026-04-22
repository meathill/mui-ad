# MuiAD Agent Guide

把 MuiAD 接到 MCP client（Claude Code / Cursor / Claude Desktop），让 Agent 替你跑完
"扫描 → 生成 → 投放 → 审核 → 监控 → 优化"整套循环。

## MCP 连接

先在 admin `/api-keys` 生成一个 per-user API key（`muiad_...`）。

**Claude Code（推荐）：**

```bash
claude mcp add --transport http muiad https://api.muiad.meathill.com/mcp \
  --header "Authorization: Bearer muiad_YOUR_KEY"
```

其他客户端参考 [DEPLOYMENT.md](../DEPLOYMENT.md#mcp-client-接入)。

## Tool 清单

12 个 tool，分三组：

### 发布方（zone 所有者）

- **`muiad_create_zone`** — 创建广告位，顺便填 `category / description / tags / audience`
  让 Agent 匹配更准
- **`muiad_list_zones`** — 看自己名下的所有 zone
- **`muiad_list_pending_attachments`** — 看等着审批的广告挂载请求
- **`muiad_review_attachment`** — 批准 / 驳回

### 广告主

- **`muiad_register_product`** — 登记一个要推广的产品
- **`muiad_scan_zones`** — **跨用户** 扫全市场的 active 广告位（支持 `category` / `tag` 过滤）
- **`muiad_create_ad`** — 创建广告，一次性挂到多个 zone；返回 `已直接上线 / 待审批 / 跳过` 三段
- **`muiad_list_ads`** — 看自己名下的所有 ad
- **`muiad_list_ads_performance`** — **主 dashboard**：每条广告的全量 + 按 zone 拆开 +
  挂载状态
- **`muiad_set_ad_status`** — 暂停 / 恢复自己的广告

### 数据

- **`muiad_get_zone_stats`** — 单个 zone 的展示/点击/CTR（含独立访客去重）
- **`muiad_get_ad_conversions`** — 单条广告的转化汇总

## 范式一：广告主自动投放

丢给 Agent 这段 prompt：

```
我的产品 https://example.com 是一个 self-hosted AI 工具。帮我：

1. 用 muiad_register_product 登记产品（名字自己起，url 和 description 填好）
2. 用 muiad_scan_zones 扫描所有 active 广告位，找 category=blog 或 tool 的
3. 从描述/标签里挑 3 个和 "AI / devtools / self-hosted" 最相关的
4. 给每个选中的 zone 写一个和它受众贴合的 title + content（不要模板化，要具体）
5. 用 muiad_create_ad 把这条广告一次挂到这 3 个 zone
6. 报告：哪些直通了、哪些进了待审批、为什么

Banner 图片现在可以先留空，明天再补。
```

Agent 会：
- 扫市场 → 用 LLM 自己做匹配度评分
- 为每个 zone 量身写文案（而不是一条文案贴所有 zone）
- 跨用户挂广告，尊重每个 zone 所有者的 `approval_mode`

## 范式二：优化循环

两三天后让 Agent 复盘：

```
用 muiad_list_ads_performance 拉我所有广告的数据。然后：
- 对 CTR 低于 0.5% 且展示超过 200 的广告，muiad_set_ad_status paused
- 对 CTR 高于 5% 的，看它在哪个 zone 上跑得最好，告诉我可以继续扩规模
- 如果有挂载状态是 pending 超过 48 小时的，提醒我 zone 所有者可能不审批了
```

Agent 自己会基于数据判断并执行。

## 范式三：zone 所有者半自动审批

如果你开了 `manual` 或 `ai` 模式：

```
用 muiad_list_pending_attachments 列出我 zone 上所有待审的广告挂载请求。
对每一条：
- 如果落地页是我认可的品类（AI / devtools / SaaS），批准
- 如果 AI 批注里提到任何 "scam" / "deceptive" 关键字，驳回并把理由 echo 出来
- 其他的先列给我，我手动决定
```

开启 `ai` 模式后，`review_note` 字段会带上 Workers AI 给的判断，Agent 可以直接拿来
做二次决策。

## 授权模型备忘

| 调用方式 | `caller.user` | 可见 / 可改 |
|---|---|---|
| admin 面板 session | 当前用户 | 只看自己名下数据 |
| MCP + `muiad_...` key | 对应用户 | 同上 |
| MCP + `MUIAD_API_KEY` | `null`（root） | 跨用户（运维 / CI 用） |

- **广告创建**：任何 per-user 调用都能挂到**任何 active zone**；是否直接上线由
  zone 所有者的 `approval_mode` 决定（auto / manual / warm / ai）
- **统计查询**：只能看自己的 ad / zone；跨用户查询会报 `不属于你`
- **状态修改**：只能改自己的 ad（`set_ad_status`）或自己的 zone 上的挂载
  （`review_attachment`）

## 当前限制

- **图片内容审核还没做**：`ai` 模式目前只看 `title / content / linkUrl`，不看
  `imageUrl`。恶意 banner 图配一个干净标题能溜过去——先靠 zone 所有者看卡片缩略图挡
- **没有批量操作 tool**：批量暂停 / 批量审批得自己循环调。如果你发现常做，开 issue
- **`warm` 模式的判断**：只看当前 zone 是否已经有 active 挂载，不看该挂载的历史表现
  ——粗粒度但能跑
