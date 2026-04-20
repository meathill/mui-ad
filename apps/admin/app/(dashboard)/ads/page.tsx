'use client';

import { PencilSimple, Pause, Play, Plus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Ad, Product } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function AdsPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [productMap, setProductMap] = useState<Map<string, Product>>(new Map());
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      const [adList, productList] = await Promise.all([api.ads.list(), api.products.list()]);
      setAds(adList);
      setProductMap(new Map(productList.map((p) => [p.id, p])));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(ad: Ad) {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setBusyId(ad.id);
    try {
      await api.ads.setStatus(ad.id, ad.status === 'active' ? 'paused' : 'active');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">ads</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">广告</h1>
        </div>
        <Link
          href="/ads/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
        >
          <Plus size={12} weight="bold" /> 创建
        </Link>
      </div>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-xl border border-rule/60">
        {ads === null ? (
          <div className="p-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>
        ) : ads.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-serif text-xl text-ink">还没有广告</p>
            <p className="mt-2 text-sm text-ink-soft">先登记产品，然后基于产品创建广告。</p>
            <Link
              href="/ads/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
            >
              <Plus size={12} weight="bold" /> 创建第一条
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-rule/60 bg-paper-deep/40 text-ink-soft">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em]">
                <th className="px-5 py-3">标题</th>
                <th className="px-5 py-3">产品</th>
                <th className="px-5 py-3">权重</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a) => (
                <tr key={a.id} className="border-b border-rule/40 last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-medium">{a.title}</div>
                    <div className="font-mono text-[10px] text-ink-soft/70">{a.id}</div>
                  </td>
                  <td className="px-5 py-4 text-ink-soft">{productMap.get(a.productId)?.name ?? '—'}</td>
                  <td className="px-5 py-4 font-mono text-[13px]">{a.weight}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => toggle(a)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-rule/40 hover:text-ink disabled:opacity-50"
                      >
                        {a.status === 'active' ? (
                          <>
                            <Pause size={12} /> 暂停
                          </>
                        ) : (
                          <>
                            <Play size={12} weight="fill" /> 启用
                          </>
                        )}
                      </button>
                      <Link
                        href={`/ads/${a.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-rule/40 hover:text-ink"
                      >
                        <PencilSimple size={12} /> 编辑
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
        isActive ? 'bg-grass/15 text-grass-deep' : 'bg-rule/60 text-ink-soft'
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-grass' : 'bg-ink-soft/40'}`} />
      {status}
    </span>
  );
}
