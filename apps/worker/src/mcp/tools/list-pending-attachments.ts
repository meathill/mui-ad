import { ads, createDb } from '@muiad/db';
import { errorResult, type McpTool, textResult } from '../types';

export const listPendingAttachmentsTool: McpTool<Record<string, never>> = {
  name: 'muiad_list_pending_attachments',
  description:
    '列出所有正在等待我（zone 所有者）审批的广告挂载请求。包含广告标题 / 文案 / ' +
    '落地页、想挂到的 zone、以及 AI 给出的 review_note（如果启用了 AI 模式）。' +
    '用 muiad_review_attachment 来批准或驳回每一条。',
  inputSchema: { type: 'object', properties: {} },
  async handler(_args, env, caller) {
    if (!caller.user) {
      return errorResult('需要登录用户（root key 模式没有归属上下文）');
    }
    const db = createDb(env.DB);
    const rows = await ads.listPendingForOwner(db, caller.user.id);
    if (rows.length === 0) return textResult('没有待审批的广告挂载请求。');

    const lines = rows.map((r) => {
      const parts = [
        `- ad_id=${r.ad.id} zone_id=${r.zone.id}`,
        `  标题: ${r.ad.title}`,
        r.ad.content ? `  文案: ${r.ad.content}` : null,
        `  落地页: ${r.ad.linkUrl}`,
        `  想挂到: ${r.zone.name} (${r.zone.width}×${r.zone.height})`,
        r.zoneAd.reviewNote ? `  AI 批注: ${r.zoneAd.reviewNote}` : null,
      ].filter(Boolean);
      return parts.join('\n');
    });
    return textResult(`待审 ${rows.length} 条：\n\n${lines.join('\n\n')}`);
  },
};
