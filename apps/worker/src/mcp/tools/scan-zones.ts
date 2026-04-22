import { createDb, zones } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  category?: string;
  tag?: string;
}

/**
 * 跨用户地列出节点里所有 active 广告位。
 * AI Agent 用来做"扫描 + 匹配"——筛选关键词靠 Agent 自己用 LLM 判断，我们只负责
 * 把描述字段完整吐出去。category / tag 是可选的服务端预过滤。
 */
export const scanZonesTool: McpTool<Args> = {
  name: 'muiad_scan_zones',
  description:
    '扫描节点里所有可投的（active 状态的）广告位，返回跨用户的完整市场视图。' +
    '用于"给一个产品找合适广告位"的匹配流程。返回每个 zone 的描述 / 分类 / 标签 / 目标受众 / 尺寸，' +
    '方便 Agent 用 LLM 判断匹配度。可以传 category / tag 做预过滤。',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: "可选的大类过滤，例如 'blog' / 'docs' / 'tool'（与 zones.category 字段精确匹配）",
      },
      tag: { type: 'string', description: '可选的 tag 过滤（在逗号分隔的 tags 字段里做子串匹配）' },
    },
  },
  async handler(args, env) {
    const db = createDb(env.DB);
    let rows = await zones.listMarketplace(db);
    if (args.category) rows = rows.filter((z) => z.category === args.category);
    if (args.tag) rows = rows.filter((z) => (z.tags ?? '').split(',').some((t) => t.trim() === args.tag));

    if (rows.length === 0) {
      return textResult('没有匹配的广告位。去掉 category/tag 过滤再试一次。');
    }

    const lines = rows.map((z) => {
      const parts = [`- ${z.id} · ${z.name} · ${z.width}×${z.height}`];
      if (z.category) parts.push(`[${z.category}]`);
      if (z.tags) parts.push(`tags=${z.tags}`);
      parts.push(`site=${z.siteUrl}`);
      if (z.description) parts.push(`\n  说明：${z.description}`);
      if (z.audience) parts.push(`\n  受众：${z.audience}`);
      return parts.join(' ');
    });
    return textResult(`扫到 ${rows.length} 个可投广告位：\n\n${lines.join('\n\n')}`);
  },
};
