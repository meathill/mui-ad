'use client';

import { Copy, PencilSimple, Pause, Play, Plus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Zone, ZoneStats } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

type StatsMap = Record<string, ZoneStats>;

export default function ZonesPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [stats, setStats] = useState<StatsMap>({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      const rows = await api.zones.list();
      setZones(rows);
      // Fire stats requests in parallel; show rows immediately, fill in as they resolve
      const entries = await Promise.all(
        rows.map(async (z) => [z.id, await api.stats.zone(z.id).catch(() => null)] as const),
      );
      const next: StatsMap = {};
      for (const [id, s] of entries) if (s) next[id] = s;
      setStats(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(zone: Zone) {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setBusyId(zone.id);
    try {
      const next = zone.status === 'active' ? 'paused' : 'active';
      await api.zones.setStatus(zone.id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function copyEmbed(id: string) {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    const { embedCode } = await api.zones.get(id);
    await navigator.clipboard.writeText(embedCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">zones</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">广告位</h1>
        </div>
        <Link
          href="/zones/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
        >
          <Plus size={12} weight="bold" /> 创建
        </Link>
      </div>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-xl border border-rule/60">
        {zones === null ? (
          <Skeleton />
        ) : zones.length === 0 ? (
          <Empty />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-rule/60 bg-paper-deep/40 text-ink-soft">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em]">
                <th className="px-5 py-3">名称</th>
                <th className="px-5 py-3">尺寸</th>
                <th className="px-5 py-3">站点</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">数据</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-rule/40 last:border-0">
                  <td className="px-5 py-4">
                    <Link href={`/zones/${z.id}/edit`} className="group/name block hover:text-ember-deep">
                      <div className="font-medium underline-offset-4 group-hover/name:underline">{z.name}</div>
                      <div className="font-mono text-[10px] text-ink-soft/70">{z.id}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px]">
                    {z.width} × {z.height}
                  </td>
                  <td className="px-5 py-4 truncate text-ink-soft" title={z.siteUrl}>
                    {z.siteUrl.replace(/^https?:\/\//, '')}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={z.status} />
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/zones/${z.id}/stats`} className="block rounded-md px-1 py-0.5 hover:bg-rule/30">
                      <StatsCell s={stats[z.id]} />
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copyEmbed(z.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-rule/40 hover:text-ink"
                      >
                        <Copy size={12} />
                        {copiedId === z.id ? '已复制' : '嵌入代码'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === z.id}
                        onClick={() => toggleStatus(z)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-rule/40 hover:text-ink disabled:opacity-50"
                      >
                        {z.status === 'active' ? (
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
                        href={`/zones/${z.id}/edit`}
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

function StatsCell({ s }: { s: ZoneStats | undefined }) {
  if (!s) {
    return <span className="font-mono text-[10px] text-ink-soft/50">—</span>;
  }
  if (s.impressions === 0) {
    return <span className="font-mono text-[11px] text-ink-soft/60">无数据</span>;
  }
  const ctrPct = (s.ctr * 100).toFixed(1);
  return (
    <div className="flex items-baseline gap-2 font-mono text-[12px]">
      <span className="text-ink">{s.impressions}</span>
      <span className="text-ink-soft/50">展示</span>
      <span className="text-ink-soft/40">·</span>
      <span className="text-ink">{s.clicks}</span>
      <span className="text-ink-soft/50">点击</span>
      <span className="text-ember-deep">({ctrPct}%)</span>
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

function Skeleton() {
  return <div className="p-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>;
}

function Empty() {
  return (
    <div className="p-10 text-center">
      <p className="font-serif text-xl text-ink">还没有广告位</p>
      <p className="mt-2 text-sm text-ink-soft">先创建一个，把嵌入代码贴到你的站点上。</p>
      <Link
        href="/zones/new"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
      >
        <Plus size={12} weight="bold" /> 创建第一个
      </Link>
    </div>
  );
}
