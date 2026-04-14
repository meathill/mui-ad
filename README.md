<p align="center">
  <strong>MuiAD</strong>
</p>

<p align="center">
  MCP-first · Self-hosted · AI 驱动<br/>
  去中心化的开发者推广网络
</p>

<p align="center">
  <code>npm create muiad@latest</code>
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

### MCP 暴露的能力

```
广告位管理
  muiad_create_zone          创建广告位，返回嵌入代码
  muiad_list_zones           列出所有广告位
  muiad_get_zone_stats       查看广告位效果数据

产品与广告
  muiad_register_product     注册产品（给个 URL，AI 自动分析）
  muiad_create_ad            创建广告（AI 自动生成物料）
  muiad_list_ads             列出所有广告

网络操作
  muiad_connect_network      连接到一个网络节点
  muiad_scan_available_zones 扫描网络中可用广告位
  muiad_submit_ad_to_zone    向某个广告位提交广告

AI 推广
  muiad_auto_promote         一键推广：AI 完成全部流程
  muiad_optimize_campaign    AI 优化现有投放

数据与结算
  muiad_get_stats            查看推广效果
  muiad_get_credits          查看积分余额
  muiad_list_conversions     查看转化明细
```

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

## 快速开始

### 前置条件

- Node.js 18+
- Cloudflare 账户（免费版即可）
- Wrangler CLI：`npm install -g wrangler`

### 部署

```bash
# 创建项目
npm create muiad@latest my-mui-ad
cd my-mui-ad

# 登录 Cloudflare
npx wrangler login

# 初始化数据库
npx wrangler d1 create muiad-db
npx wrangler kv:namespace create MUIAD_CACHE
npx wrangler r2 bucket create muiad-assets

# 部署
npm run deploy
```

部署完成后，你会得到一个 Worker URL，比如 `https://my-mui-ad.your-name.workers.dev`。

### 在 AI Agent 中配置 MCP

在你的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "muiad": {
      "url": "https://my-mui-ad.your-name.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

### 开始使用

现在你可以在 Cursor / Claude / 任何支持 MCP 的 AI Agent 中说：

```
"帮我在 jsonformatter.pro 的侧边栏创建一个 300x250 的广告位"
```

```
"注册我的产品 https://jsonformatter.pro，然后帮我推广到网络中所有匹配的广告位"
```

```
"这周推广效果怎么样？帮我分析一下数据"
```

就这样。没有其他步骤了。

---

## 技术架构

```
Cloudflare Workers
├── D1 (SQLite)         结构化数据：广告位、产品、归因、积分
├── KV                  缓存：广告位配置、会话
├── R2                  文件存储：Banner 图片、生成的物料
├── Queues              消息队列：异步任务
└── Workers             计算层
    ├── /api/v1/*       REST API
    ├── /mcp            MCP Server 端点
    ├── /widget.js      广告渲染脚本
    ├── /track/*        归因追踪
    └── /peer/*         节点间通信
```

**成本：Cloudflare 免费额度覆盖大多数独立开发者的需求。**

---

## 项目结构

```
muiad/
├── src/
│   ├── worker/              # Cloudflare Worker 入口
│   │   ├── index.ts         # 主路由
│   │   ├── mcp.ts           # MCP Server 实现
│   │   └── middleware.ts    # 认证与限流
│   ├── modules/
│   │   ├── ad-server/       # 广告投放引擎
│   │   ├── attribution/     # 归因追踪
│   │   ├── ai-agent/        # AI 推广代理
│   │   ├── network/         # 去中心化网络
│   │   └── credits/         # 积分系统
│   ├── db/
│   │   ├── schema.sql       # D1 表结构
│   │   └── migrations/      # 数据库迁移
│   └── shared/              # 共享类型与工具
├── wrangler.toml
├── package.json
└── README.md
```

---

## Roadmap

- [x] **MVP-0** 单实例广告投放 + MCP + 广告渲染
- [x] **MVP-1** 归因追踪 + 数据统计
- [ ] **MVP-2** AI Agent（扫描 + 生成物料 + 自动投放 + 优化）
- [ ] **MVP-3** 节点间通信 + 网络发现
- [ ] **MVP-4** 积分系统 + 公共节点 all-mui-ad
- [ ] **Dashboard** 可选的 Web 管理面板
- [ ] **SDK** 前端 SDK（React / Vue / Vanilla）
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
