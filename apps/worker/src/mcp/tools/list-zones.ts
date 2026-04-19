import { createDb, zones } from '@muiad/db';
import { type McpTool, textResult } from '../types';

export const listZonesTool: McpTool<Record<string, never>> = {
  name: 'muiad_list_zones',
  description: '列出所有广告位及其状态、尺寸和创建时间。',
  inputSchema: { type: 'object', properties: {} },
  async handler(_args, env) {
    const db = createDb(env.DB);
    const rows = await zones.list(db);
    if (rows.length === 0) {
      return textResult('当前没有广告位。调用 muiad_create_zone 创建一个。');
    }
    const lines = rows.map((z) => `- ${z.id} · ${z.name} · ${z.width}×${z.height} · ${z.status} · ${z.siteUrl}`);
    return textResult(`共 ${rows.length} 个广告位：\n${lines.join('\n')}`);
  },
};
