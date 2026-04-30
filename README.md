<p align="center">
  <strong>MuiAD</strong>
</p>

<p align="center">
  Self-hosted ad network for the MCP era.<br/>
  MCP-first · 跑在你自己的 Cloudflare 账号里 · AI 驱动
</p>

<p align="center">
  <a href="https://muiad.meathill.com">muiad.meathill.com</a> ·
  <a href="https://admin.muiad.meathill.com">公开 demo 节点</a> ·
  <a href="./docs/AGENT_GUIDE.md">Agent 使用指南</a>
</p>

<p align="center">
  <strong>当前状态：v1 · public beta</strong>（MVP-0 / 1 / 2 已上线，MVP-3 / 4 路上）
</p>

---

## 写代码就够了，推广交给 AI

你是不是也这样——

写代码、调 bug，可以通宵达旦，乐此不疲。但一想到要做推广，就浑身抗拒。不是不会，是本能地不想碰。

所以 MuiAD 的设计目标只有一个：

> **让你在写代码的时候，顺便就把推广的事办了。**

不需要打开什么推广后台，不需要手动设计 banner，不需要到处找合作方。你的 AI Agent 通过 MCP 直接操作 MuiAD，全自动完成一切。

---

## 它是什么

MuiAD 是一个部署在 Cloudflare Workers 上的 Serverless 广告网络服务。

每个部署实例都是一个**节点**。节点之间可以互联，形成去中心化的推广网络。你也可以不连接任何网络，只用它来管理自己产品矩阵之间的交叉推广。

**三种使用方式，由你选择：**

| 模式 | 说明 | 适合谁 |
|------|------|--------|
| **孤岛模式** | 不连接任何网络，自己的产品互相推广 | 有多个产品的独立开发者 |
| **节点模式** | 部署实例，连接到公共网络，与其他开发者互推 | 想要流量互换的开发者 |
| **免部署模式** | 直接使用公共节点，零部署开始推广 | 不想折腾基础设施的开发者 |

---

## AI 是你的推广员

MuiAD 的核心交互方式是 **MCP（Model Context Protocol）**。这意味着你的 AI Agent（Cursor、Claude、Windsurf……随你用哪个）可以直接操作 MuiAD。

### 你只需要说一句话

```
"帮我把 jsonformatter.pro 推广到所有能触达的开发者受众广告位上"
```

AI Agent 会自动完成以下全部流程：

```
📡 扫描网络中的可用广告位
    ↓
🎯 分析哪些广告位适合你的产品
    ↓
🎨 调用 AI 生成 banner 图、宣传文案等物料
    ↓
📤 自动提交到目标广告位
    ↓
📊 持续监控效果，自动优化投放策略
    ↓
🔄 循环寻找新的推广机会
```

你不需要做任何手动操作。你甚至不需要打开 MuiAD 的 Dashboard。

### 当前 12 个 MCP tool（MVP-2 已落地）

```
发布方（zone 所有者）
  muiad_create_zone               创建广告位，返回 zone_id + 嵌入代码
  muiad_list_zones                列出自己的广告位
  muiad_list_pending_attachments  看待审广告挂载请求（带 AI 批注）
  muiad_review_attachment         批准 / 驳回挂载

广告主
  muiad_scan_zones                跨节点扫描所有 active 广告位（市场视图）
  muiad_register_product          登记要推广的产品
  muiad_create_ad                 创建广告，一次性挂到多个 zone
  muiad_list_ads                  列出自己的广告
  muiad_set_ad_status             暂停 / 恢复自己的广告
  muiad_list_ads_performance      看每条广告的全量 + 按 zone 拆开 + 挂载状态

数据
  muiad_get_zone_stats            单个 zone 的展示 / 点击 / CTR / 独立访客
  muiad_get_ad_conversions        单条广告的转化汇总（按事件类型）
```

完整使用指南、Agent prompt 模板、授权模型见 [AGENT_GUIDE.md](./docs/AGENT_GUIDE.md)。

### MVP-2 完整闭环

✅ **跨用户广告市场** — A 的广告能挂到 B 的 zone，每个 zone 所有者可选 4 档审批模式

| 模式 | 说明 |
|---|---|
| `auto` | 直接上线（默认） |
| `manual` | 进 `/approvals` 待审 |
| `warm` | 该 zone 已经有 active 广告 → 直通；否则 pending |
| `ai` | Workers AI 自动审（文本 + 图片，fail-closed） |

✅ **Workers AI 内置审核** — `@cf/meta/llama-3.1-8b-instruct` 审文本，`@cf/llava-hf/llava-1.5-7b-hf` 审图片；任一失败降级 pending，理由写进 `review_note`

✅ **完整反馈循环** — Agent 拉 `list_ads_performance` 看效果 → 用 `set_ad_status` 自动暂停低 CTR 广告

✅ **多用户体系** — better-auth + per-user API key（`muiad_...`）；admin 在 `/users` 建号发给广告主

---

## 去中心化网络

任何人都可以部署自己的 MuiAD 实例，任何人也都可以加入其他人的网络。

```
                    ┌──────────────────┐
                    │   all-mui-ad     │
                    │  （公共发现节点）  │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │my-mui-ad │      │his-mui-ad│      │her-mui-ad│
    │ (你的)    │      │ (甲的)    │      │ (乙的)    │
    └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                  │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │ 你的产品  │      │ 甲的产品  │      │ 乙的产品  │
    │ A1 A2 A3 │      │ B1 B2    │      │ C1       │
    └──────────┘      └──────────┘      └──────────┘
```

- **公共节点**（如 all-mui-ad）只负责发现和注册，不存储业务数据
- 广告数据在节点之间**直传**，不经过中间方
- 每个节点完全自主，可以随时断开连接
- 你也可以把自己的所有产品注册到一个私有节点中，自己推广自己

---

## Credit 积分系统

推广不一定要花钱。MuiAD 内置了灵活的积分经济：

| 模式 | 说明 |
|------|------|
| **流量互换** | 你展示别人的广告赚积分，用积分让别人展示你的广告 |
| **CPA 付费** | 按转化计费——别人给你带来一个注册/下载，你付积分 |
| **Rev Share** | 按收入分成——别人给你带来一个付费用户，你分一部分收入 |
| **积分转账** | 节点之间可以直接互转积分 |

每个节点可以自定义定价。积分在节点间流通，形成自然的推广经济。

---

## MCP 接入

MuiAD 是"自托管"产品——每个人跑自己的节点。下面假设你已经按 **自部署** 一节建好了自己的 worker（`api.your-muiad.com`）并完成了 owner 注册。

> **推荐用 per-user API key**，不要直接用 root `MUIAD_API_KEY`。
> 在 admin `/api-keys` 页生成一个 `muiad_...` key（只显示一次，复制走）；
> MCP 创建的数据会自动归到你账号下。

**Claude Code** — 一行 CLI：

```bash
claude mcp add --scope user --transport http muiad https://api.your-muiad.com/mcp \
  --header "Authorization: Bearer muiad_xxx"
```

或编辑 `~/.claude.json` / 项目 `.mcp.json`：

```json
{
  "mcpServers": {
    "muiad": {
      "type": "http",
      "url": "https://api.your-muiad.com/mcp",
      "headers": { "Authorization": "Bearer muiad_xxx" }
    }
  }
}
```

> ⚠️ 不要走 GUI "Connectors" 添加——那里只支持 OAuth，我们节点没实现 OAuth，点 Connect 会失败。

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "muiad": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://api.your-muiad.com/mcp",
        "--header", "Authorization:Bearer muiad_xxx",
        "--transport", "http-only"
      ]
    }
  }
}
```

**Cursor** — settings → MCP：

```json
{
  "mcpServers": {
    "muiad": {
      "url": "https://api.your-muiad.com/mcp",
      "headers": { "Authorization": "Bearer muiad_xxx" }
    }
  }
}
```

然后对 AI 说：

> 帮我用 MuiAD 登记一个产品叫 foo-cli，URL 是 https://foo.dev，然后创建一个 300×250 的广告位，生成一条广告投到那个位置上。

> 想先看看它长什么样？访问 [muiad.meathill.com](https://muiad.meathill.com)——首页右边那格 300×250 就是本产品在自己 landing 上投的广告（通过同一套 MCP 调用创建）。

---

## 自部署

### 前置条件

- Node.js 18+
- Cloudflare 账户（免费版即可）
- Wrangler CLI：`npm install -g wrangler`

### 部署

完整步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。简化版：

```bash
# 克隆 + 装依赖
git clone https://github.com/meathill/mui-ad.git && cd mui-ad && pnpm install

# 登录 Cloudflare
cd apps/worker && pnpm wrangler login

# 创建 D1 + R2
pnpm wrangler d1 create muiad
pnpm wrangler r2 bucket create muiad-uploads
# 把返回的 database_id 填进 apps/worker/wrangler.jsonc 和 apps/web/wrangler.jsonc

# 应用迁移
cd ../../packages/db && pnpm run migrate:remote

# 设两个 secret（用 printf 避免 echo 带换行）
cd ../../apps/worker
printf '%s' "$(node -e 'console.log(crypto.randomBytes(32).toString("base64url"))')" | \
  pnpm wrangler secret put MUIAD_API_KEY
printf '%s' "$(node -e 'console.log(crypto.randomBytes(32).toString("base64url"))')" | \
  pnpm wrangler secret put BETTER_AUTH_SECRET

# 部署 worker
pnpm wrangler deploy

# 部署 admin（OpenNext）
cd ../admin
CLOUDFLARE_ACCOUNT_ID=<你的> pnpm run deploy
```

### 初始化节点（只需一次）

部署完成后：

1. 访问 admin（默认 `https://muiad-admin.<subdomain>.workers.dev`）
2. `/setup` 填 worker URL + `MUIAD_API_KEY`（root key，存 localStorage）
3. `/signup` 注册第一个账号 → **自动成为 admin / owner**
4. `/users` → 点 "认领孤儿数据" → 把现有 zone / ad / product 归到你名下
5. `/account` → 选广告上线策略（auto / manual / warm / Workers AI）
6. `/api-keys` → 生成一个 `muiad_...` key 给 MCP 用
7. 之后新用户：admin 在 `/users` 直接建号发给对方；对方登录后去 `/account` 改密码

之后 `/signup` 自动关闭——这个节点就属于你了。

### 开始使用

把 `muiad_...` key 配到 Claude Code（参考 [MCP 接入](#mcp-接入)），然后说：

```
"帮我用 MuiAD 登记产品 jsonformatter.pro，扫一下哪些 zone 匹配 devtools 类，
 给每个写一段贴合的文案挂上去。"
```

```
"拉一下我所有广告的效果，CTR 低于 0.5% 且展示超过 200 的暂停掉。"
```

更多 prompt 范式见 [AGENT_GUIDE.md](./docs/AGENT_GUIDE.md)。

---

## 技术架构

```
Cloudflare 资源
├── D1 (SQLite)        广告位 / 产品 / 广告 / 归因 / 用户 / API key / 设置
├── R2                 banner 图片 + AI 生成物料
└── Workers AI         内容审核（@cf/meta/llama-3.1-8b + @cf/llava-hf/llava-1.5-7b）

Worker (apps/worker)
├── /auth/*            better-auth handler（session cookie 跨子域）
├── /api/{products,zones,ads,stats,ai-generations,api-keys,settings,approvals,admin}
├── /mcp               MCP Server（JSON-RPC 2.0，12 个 tool）
├── /serve             /serve?zone=<id> 给 widget 拉广告
├── /track/{click,conversion}
├── /widget.js         嵌入脚本
├── /uploads           authed R2 上传
└── /files/<key>       R2 直读（公开，CDN 缓存）

Admin (apps/admin · Next.js + OpenNext)
├── /signup /login /account /users
├── /zones /products /ads /ai-generations
├── /approvals         待审广告挂载 + AI 批注展示
└── /api-keys          per-user MCP key 生成 / 撤销

鉴权三路（优先级从高到低）
1. better-auth session cookie  → admin 面板
2. Bearer muiad_<base64url>     → per-user API key（MCP / CI）
3. Bearer <MUIAD_API_KEY>       → root（兜底 / 运维）
```

**成本：Cloudflare 免费额度覆盖大多数独立开发者的需求。**
Workers AI 审核也走免费配额；OpenAI / Gemini banner 生成走你自己的 key（BYOK）。

---

## 项目结构（monorepo）

```
mui-ad/
├── apps/
│   ├── web/                 # 营销站 landing + waitlist（Next.js 16 + OpenNext）
│   ├── admin/               # 节点管理面板（Next.js 16 + OpenNext）
│   │   └── app/
│   │       ├── (dashboard)/   # zones / ads / products / ai-generations /
│   │       │                  # approvals / api-keys / users / account
│   │       ├── login /signup
│   │       └── setup
│   └── worker/              # API + MCP + /auth + /serve + /track（Hono）
│       └── src/
│           ├── index.ts
│           ├── auth/                # better-auth + admin plugin
│           ├── lib/moderation.ts    # Workers AI 文本 + 图片审核
│           ├── lib/session.ts       # muiad_sid cookie（独立访客去重）
│           ├── middleware/auth.ts   # session > muiad_key > root key 三路
│           ├── modules/ad-server/   # 加权随机投放
│           ├── mcp/
│           │   ├── server.ts        # JSON-RPC dispatcher
│           │   └── tools/           # 12 个 muiad_* 一个文件
│           └── routes/
│               ├── api/             # 9 个子 router
│               ├── serve.ts /track.ts /widget.ts /uploads.ts /files.ts
│               └── mcp.ts
├── packages/
│   └── db/                  # 共享 schema + repository + 12 个迁移
│       ├── src/
│       │   ├── schema/      # 14 张表的 drizzle 定义
│       │   ├── repository/  # 按领域拆的纯函数 CRUD
│       │   └── migrations/  # 0001 ~ 0012 SQL
│       └── tests/
├── docs/
│   └── AGENT_GUIDE.md       # Agent 使用指南：tool 清单 + prompt 范式
├── TECH_SPEC.md
├── DEPLOYMENT.md
├── DEV_NOTE.md
└── README.md
```

---

## Roadmap

已发布：

- [x] **MVP-0** 单实例广告投放 + MCP + widget 渲染
- [x] **MVP-1** 完整归因追踪（UTM / referer / conversions / session 去重独立访客）
- [x] **MVP-2** AI Agent 闭环
  - 12 个 MCP tool
  - 跨用户广告市场 + 4 档审批模式
  - Workers AI 自动审核（文本 + 图片）
  - BYOK banner 生成（OpenAI gpt-image-2 / Gemini）
- [x] **Auth** better-auth + per-user API key + 用户体系
- [x] **Admin Panel** 全套 CRUD + 数据可视化 + AI banner composer

路上：

- [ ] **MVP-3** 节点间通信 + 网络发现（A 节点的 Agent 看到 B 节点的广告位）
- [ ] **MVP-4** 流量经济（积分互换 / Rev share / 公共节点 all-mui-ad）
- [ ] **SDK** 前端嵌入 SDK（React / Vue / Vanilla）
- [ ] **防作弊** 异常检测 + 声誉系统

---

## 为什么叫 MuiAD

**Mui** = Mutual（互惠）+ UI（界面）

广告是 UI 的一部分，推广应该是互惠的。每个开发者都在展示别人的广告，也在被别人推广。没有中心化的平台抽成，没有信息黑箱。你帮我，我帮你，AI 来干脏活。

---

## License

MIT

---

<p align="center">
  写代码就够了。<br/>
  推广的事，交给 AI。
</p>
