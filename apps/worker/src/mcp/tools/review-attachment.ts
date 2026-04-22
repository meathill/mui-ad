import { ads, createDb } from '@muiad/db';
import { errorResult, type McpTool, textResult } from '../types';

interface Args {
  zone_id: string;
  ad_id: string;
  decision: 'approve' | 'reject';
  note?: string;
}

/**
 * Zone 所有者审批落在自己 zone 上的广告。对应 admin /approvals 页面的操作。
 * Agent 如果代表 zone 所有者工作（或 owner 想半自动化批量处理待审），
 * 可以用这个 tool 完成批/驳。
 */
export const reviewAttachmentTool: McpTool<Args> = {
  name: 'muiad_review_attachment',
  description:
    '作为 zone 所有者批准或驳回一条挂在自己 zone 上的广告（对应 admin 面板 /approvals）。' +
    '先用 muiad_list_pending_attachments 看待审列表，再用这个 tool 下决定。',
  inputSchema: {
    type: 'object',
    properties: {
      zone_id: { type: 'string' },
      ad_id: { type: 'string' },
      decision: { type: 'string', enum: ['approve', 'reject'] },
      note: { type: 'string', description: '可选的批注；驳回时强烈建议写' },
    },
    required: ['zone_id', 'ad_id', 'decision'],
  },
  async handler(args, env, caller) {
    if (!caller.user) {
      return errorResult('审批只能由登录用户调用（root key 模式不区分用户身份）');
    }
    if (args.decision !== 'approve' && args.decision !== 'reject') {
      return errorResult("decision 必须是 'approve' 或 'reject'");
    }
    const db = createDb(env.DB);
    const ok = await ads.reviewAttachment(db, {
      zoneId: args.zone_id,
      adId: args.ad_id,
      ownerId: caller.user.id,
      decision: args.decision === 'approve' ? 'active' : 'rejected',
      note: args.note,
    });
    if (!ok) {
      return errorResult('找不到这条待审记录，或 zone 不属于你。');
    }
    return textResult(
      args.decision === 'approve'
        ? `已批准：ad ${args.ad_id} 在 zone ${args.zone_id} 开始投放。`
        : `已驳回：ad ${args.ad_id} 不会在 zone ${args.zone_id} 出现。`,
    );
  },
};
