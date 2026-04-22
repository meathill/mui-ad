import { ads, createDb } from '@muiad/db';
import { errorResult, type McpTool, textResult } from '../types';

interface Args {
  ad_id: string;
  status: 'active' | 'paused';
}

/**
 * 暂停或恢复自己名下的广告。被暂停的广告不会再被 /serve 选中，但历史数据保留。
 * Agent 拉完 performance 后用这个来关掉 CTR 糟糕的广告。
 */
export const setAdStatusTool: McpTool<Args> = {
  name: 'muiad_set_ad_status',
  description:
    '暂停或恢复自己名下的广告。status=paused 停止投放；status=active 恢复投放。' +
    '在看完 muiad_list_ads_performance 后用这个来关掉表现不好的广告。',
  inputSchema: {
    type: 'object',
    properties: {
      ad_id: { type: 'string', description: '广告 ID' },
      status: { type: 'string', enum: ['active', 'paused'], description: "目标状态：'active' 或 'paused'" },
    },
    required: ['ad_id', 'status'],
  },
  async handler(args, env, caller) {
    if (args.status !== 'active' && args.status !== 'paused') {
      return errorResult(`status 必须是 'active' 或 'paused'，收到 '${args.status}'`);
    }
    const db = createDb(env.DB);
    const updated = await ads.setStatus(db, args.ad_id, args.status, caller.user?.id);
    if (!updated) {
      return errorResult(`找不到 ad_id=${args.ad_id}（可能不存在，或不属于你）。`);
    }
    return textResult(`广告「${updated.title}」状态已改为 ${updated.status}。`);
  },
};
