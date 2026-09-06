# TODO - MuiAD 长期计划

> 长期待办，只记还没做的事。已上线的历史见 README Roadmap 与 git log。
> 最后更新：2026-09-06（维护轮清理：MVP-0/1/2 已上线内容移出，只留 MVP-3/4 与开放问题）

## MVP-3：节点间通信 + 网络发现

- 节点发现（公共注册节点 / 手动添加）
- 节点间 REST API 直传广告数据
- 广告位共享与查询
- 节点自主连接与断开

交付标准：两个独立部署的实例能互相发现广告位并提交广告。

## MVP-4：积分系统 + 公共节点

- 流量互换、CPA 付费、Rev Share、积分转账
- 部署 all-mui-ad 公共节点
- 积分在节点间流通

交付标准：积分能在节点间流通，推广效果能通过积分量化。

## 待办（按优先级）

- [ ] waitlist 速率限制（IP / 时间窗 middleware，或 Turnstile）
- [ ] `warm` 模式 trust decay（当前只看有无 active 挂载，spam 混入后永久 warm；考虑加"最近 7 天没被驳过"条件）
- [ ] per-user Workers AI 用量配额（免费额度全 worker 共享，防大图片刷量）
- [ ] Workers AI 审核 prompt V2（等真实误判案例再迭代，可考虑争议样本留档表）
- [ ] SDK：前端嵌入 SDK（React / Vue / Vanilla）
- [ ] 防作弊：异常检测 + 声誉系统
- [ ] 自定义域名 `muiad.dev` 接入（待 DNS 迁至 CF）

## 开放问题

- [ ] MCP transport 选型：SSE vs Streamable HTTP
- [ ] AI 物料生成的 LLM API 选型（当前 BYOK：OpenAI gpt-image-2 / Gemini）
- [ ] 节点间通信的认证机制
- [ ] 积分的"锚定"问题
