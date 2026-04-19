import { createDb, stats } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  zone_id: string;
}

export const getZoneStatsTool: McpTool<Args> = {
  name: 'muiad_get_zone_stats',
  description: '查看单个广告位的累计展示量、点击量与 CTR。',
  inputSchema: {
    type: 'object',
    properties: {
      zone_id: { type: 'string', description: '广告位 ID' },
    },
    required: ['zone_id'],
  },
  async handler(args, env) {
    const db = createDb(env.DB);
    const s = await stats.zoneStats(db, args.zone_id);
    const ctrPct = (s.ctr * 100).toFixed(2);
    return textResult(
      `广告位 ${args.zone_id} 的统计：\n` +
        `- 展示量: ${s.impressions}\n` +
        `- 点击量: ${s.clicks}\n` +
        `- CTR: ${ctrPct}%`,
    );
  },
};
