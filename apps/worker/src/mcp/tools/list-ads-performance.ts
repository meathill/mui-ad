import { ads, createDb, stats } from '@muiad/db';
import { type McpTool, textResult } from '../types';

/**
 * Agent 做投放优化的主入口：列出自己的广告 + 全局量 + 按 zone 拆开 + 挂载状态
 * （active / pending / rejected）。一次调用拿到所有做决策要的信息。
 */
export const listAdsPerformanceTool: McpTool<Record<string, never>> = {
  name: 'muiad_list_ads_performance',
  description:
    '列出我名下所有广告的效果数据：展示 / 点击 / CTR / 独立访客；并按每个 zone 拆开，' +
    '附带在该 zone 上的挂载状态（active 已上线 / pending 待审 / rejected 被驳回）。' +
    'Agent 用这个决定要不要暂停低 CTR 广告、追加预算到高 CTR 的 zone。',
  inputSchema: { type: 'object', properties: {} },
  async handler(_args, env, caller) {
    const db = createDb(env.DB);
    const myAds = await ads.list(db, caller.user?.id);
    if (myAds.length === 0) return textResult('还没有广告。');

    const adIds = myAds.map((a) => a.id);
    const attachments = await ads.listAttachmentsForAds(db, adIds);
    const byAd = new Map<string, typeof attachments>();
    for (const a of attachments) {
      const list = byAd.get(a.adId) ?? [];
      list.push(a);
      byAd.set(a.adId, list);
    }

    const lines: string[] = [];
    for (const ad of myAds) {
      const totals = await stats.adTotals(db, ad.id);
      const conv = await stats.conversionsForAd(db, ad.id);
      const perZone = await stats.adByZone(db, ad.id);
      const perZoneMap = new Map(perZone.map((r) => [r.zoneId, r]));

      const ctrPct = (totals.ctr * 100).toFixed(2);
      const convValue = conv.byEventType.reduce((s, r) => s + r.totalValue, 0);
      lines.push(
        `\n## ${ad.title} · ${ad.id}` +
          `\n- 广告自身状态: ${ad.status}` +
          `\n- 展示 ${totals.impressions}（独立 ${totals.uniqueViewers}） · 点击 ${totals.clicks}（独立 ${totals.uniqueClickers}） · CTR ${ctrPct}%` +
          `\n- 转化 ${conv.total}${conv.total > 0 ? ` · value 合计 ${convValue}（最小单位）` : ''}`,
      );

      const atts = byAd.get(ad.id) ?? [];
      if (atts.length === 0) {
        lines.push('  （未投放到任何 zone）');
        continue;
      }
      lines.push('  挂载:');
      for (const att of atts) {
        const p = perZoneMap.get(att.zoneId);
        const perf = p ? `${p.impressions}/${p.clicks} · ${(p.ctr * 100).toFixed(2)}%` : '—';
        lines.push(`  - [${att.status}] ${att.zoneName} (${att.zoneId}) · ${perf}`);
      }
    }
    return textResult(`共 ${myAds.length} 条广告：${lines.join('\n')}`);
  },
};
