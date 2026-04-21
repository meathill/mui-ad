import { createDb, stats, zones } from '@muiad/db';
import { errorResult, type McpTool, textResult } from '../types';

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
  async handler(args, env, caller) {
    const db = createDb(env.DB);
    // per-user 调用：只能看自己名下的 zone
    const zone = await zones.get(db, args.zone_id, caller.user?.id);
    if (!zone) {
      return errorResult(`找不到 zone_id=${args.zone_id}（可能不存在，或不属于你）。`);
    }
    const s = await stats.zoneStats(db, args.zone_id);
    const ctrPct = (s.ctr * 100).toFixed(2);
    return textResult(
      `广告位 ${args.zone_id} 的统计：\n` +
        `- 展示量: ${s.impressions}（独立访客 ${s.uniqueViewers}）\n` +
        `- 点击量: ${s.clicks}（独立点击者 ${s.uniqueClickers}）\n` +
        `- CTR: ${ctrPct}%`,
    );
  },
};
