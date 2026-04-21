import { ads, createDb } from '@muiad/db';
import { type McpTool, textResult } from '../types';

export const listAdsTool: McpTool<Record<string, never>> = {
  name: 'muiad_list_ads',
  description: '列出所有广告，包括标题、关联产品、权重与状态。',
  inputSchema: { type: 'object', properties: {} },
  async handler(_args, env, caller) {
    const db = createDb(env.DB);
    const rows = await ads.list(db, caller.user?.id);
    if (rows.length === 0) {
      return textResult('当前没有广告。调用 muiad_create_ad 创建一个。');
    }
    const lines = rows.map((a) => `- ${a.id} · ${a.title} · 权重 ${a.weight} · ${a.status} · product=${a.productId}`);
    return textResult(`共 ${rows.length} 条广告：\n${lines.join('\n')}`);
  },
};
