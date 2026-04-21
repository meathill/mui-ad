import { createDb, stats } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  ad_id: string;
}

export const getAdConversionsTool: McpTool<Args> = {
  name: 'muiad_get_ad_conversions',
  description: '查看某条广告的转化汇总（按事件类型聚合的 count 和 value 总和；value 以分为单位存储）。',
  inputSchema: {
    type: 'object',
    properties: {
      ad_id: { type: 'string', description: '广告 ID' },
    },
    required: ['ad_id'],
  },
  async handler(args, env) {
    const db = createDb(env.DB);
    const summary = await stats.conversionsForAd(db, args.ad_id);
    if (summary.total === 0) {
      return textResult(
        `广告 ${args.ad_id} 当前没有转化事件。\n广告主落地页 POST /track/conversion { click_id, event_type, value? } 即可回传。`,
      );
    }
    const lines = summary.byEventType.map(
      (b) => `- ${b.eventType}: ${b.count} 次${b.totalValue > 0 ? `，value 合计 ${b.totalValue}（分/最小单位）` : ''}`,
    );
    return textResult(
      `广告 ${args.ad_id} 的转化汇总：\n- 总次数: ${summary.total}\n\n按事件类型：\n${lines.join('\n')}`,
    );
  },
};
