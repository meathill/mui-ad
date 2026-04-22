'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Ad, Zone } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

type Pending = {
  zoneAd: { zoneId: string; adId: string; advertiserId: string | null; createdAt: number | null };
  ad: Ad;
  zone: Zone;
};

export default function ApprovalsPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [rows, setRows] = useState<Pending[] | null>(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      setRows(await api.approvals.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(p: Pending, decision: 'approve' | 'reject') {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    const key = `${p.zoneAd.zoneId}:${p.zoneAd.adId}`;
    setActing(key);
    try {
      if (decision === 'approve') await api.approvals.approve(p.zoneAd.zoneId, p.zoneAd.adId);
      else await api.approvals.reject(p.zoneAd.zoneId, p.zoneAd.adId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">moderation</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">待审批</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        其他广告主想把广告挂到你的 zone 上。你在 /account 设的"广告上线策略"决定了哪些会进这里。
      </p>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      {rows === null ? (
        <div className="mt-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-rule/60 bg-paper-deep/30 p-10 text-center">
          <p className="font-serif text-xl text-ink">没有待审批的广告</p>
          <p className="mt-2 text-sm text-ink-soft">新广告来的时候会出现在这里。</p>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {rows.map((p) => {
            const key = `${p.zoneAd.zoneId}:${p.zoneAd.adId}`;
            const busy = acting === key;
            return (
              <li key={key} className="rounded-xl border border-rule/60 bg-paper p-5">
                <div className="flex items-start gap-4">
                  {p.ad.imageUrl && (
                    // biome-ignore lint/performance/noImgElement: preview only
                    <img
                      src={p.ad.imageUrl}
                      alt={p.ad.title}
                      className="h-20 w-32 shrink-0 rounded-md bg-paper-deep/40 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-lg">{p.ad.title}</div>
                    {p.ad.content && <p className="mt-1 text-sm text-ink-soft">{p.ad.content}</p>}
                    <div className="mt-2 font-mono text-[11px] text-ink-soft/80">
                      落地页：
                      <a
                        href={p.ad.linkUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-ember-deep underline-offset-4 hover:underline"
                      >
                        {p.ad.linkUrl}
                      </a>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-soft/60">
                      想挂到 · {p.zone.name}（{p.zone.width}×{p.zone.height}）
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(p, 'reject')}
                    className="rounded-full border border-danger/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-danger-deep transition-colors hover:bg-danger hover:text-paper disabled:opacity-60"
                  >
                    驳回
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(p, 'approve')}
                    className="rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
                  >
                    {busy ? '处理中…' : '批准上线'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
