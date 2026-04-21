'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Ad, ConversionByAdRow, RefererRow, UtmSourceRow, Zone, ZoneStats } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

type Breakdown = {
  zoneId: string;
  totals: ZoneStats;
  utmSources: UtmSourceRow[];
  referers: RefererRow[];
  conversions: ConversionByAdRow[];
};

export default function ZoneStatsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);

  const [zone, setZone] = useState<Zone | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [adIndex, setAdIndex] = useState<Map<string, Ad>>(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const [zoneDetail, brk, ads] = await Promise.all([
          api.zones.get(id),
          api.stats.zoneBreakdown(id),
          api.ads.list(),
        ]);
        setZone(zoneDetail.zone);
        setBreakdown(brk);
        setAdIndex(new Map(ads.map((a) => [a.id, a])));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [workerUrl, apiKey, id]);

  if (error) {
    return (
      <div className="max-w-3xl">
        <BackLink />
        <p className="mt-4 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>
      </div>
    );
  }
  if (!zone || !breakdown) {
    return <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>;
  }

  const ctrPct = (breakdown.totals.ctr * 100).toFixed(2);
  const totalUtm = breakdown.utmSources.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="max-w-3xl">
      <BackLink />
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">zone stats</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">{zone.name}</h1>
          <p className="mt-2 font-mono text-[11px] text-ink-soft">
            {zone.width}×{zone.height} · {zone.siteUrl}
          </p>
        </div>
        <Link
          href={`/zones/${id}/edit`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
        >
          编辑 →
        </Link>
      </div>

      <section className="mt-10 grid grid-cols-3 gap-4">
        <BigStat
          label="展示"
          value={breakdown.totals.impressions}
          sublabel={`${breakdown.totals.uniqueViewers} 独立`}
        />
        <BigStat label="点击" value={breakdown.totals.clicks} sublabel={`${breakdown.totals.uniqueClickers} 独立`} />
        <BigStat label="CTR" value={`${ctrPct}%`} accent />
      </section>

      <section className="mt-14">
        <SectionHead label="utm 来源" title="点击来自哪里" />
        {breakdown.utmSources.length === 0 ? (
          <EmptyCell hint="还没有点击。" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-rule/60">
            <table className="w-full text-sm">
              <thead className="border-b border-rule/60 bg-paper-deep/40 text-ink-soft">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em]">
                  <th className="px-5 py-3">utm_source</th>
                  <th className="px-5 py-3 text-right">点击</th>
                  <th className="px-5 py-3">占比</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.utmSources
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((r) => {
                    const pct = (r.count / totalUtm) * 100;
                    return (
                      <tr key={r.source ?? '_null'} className="border-b border-rule/40 last:border-0">
                        <td className="px-5 py-3 font-mono text-[13px]">
                          {r.source ?? <span className="text-ink-soft/60">（直接 / 未标注）</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-mono">{r.count}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rule/40">
                              <div className="h-full bg-ember" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] text-ink-soft">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-14">
        <SectionHead label="referers" title="广告出现在哪些页面" />
        {breakdown.referers.length === 0 ? (
          <EmptyCell hint="还没有带 referer 的点击。" />
        ) : (
          <ul className="space-y-1.5">
            {breakdown.referers.map((r) => (
              <li
                key={r.referer ?? '_null'}
                className="flex items-baseline justify-between gap-4 rounded-lg border border-rule/60 px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-soft" title={r.referer ?? ''}>
                  {r.referer ? r.referer.replace(/^https?:\/\//, '') : <span>（无 referer）</span>}
                </span>
                <span className="font-mono text-[12px] text-ink">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <SectionHead label="conversions" title="转化按广告汇总" />
        {breakdown.conversions.length === 0 ? (
          <EmptyCell hint="还没有转化。广告主落地页 POST /track/conversion 即可回传。" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-rule/60">
            <table className="w-full text-sm">
              <thead className="border-b border-rule/60 bg-paper-deep/40 text-ink-soft">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em]">
                  <th className="px-5 py-3">广告</th>
                  <th className="px-5 py-3 text-right">次数</th>
                  <th className="px-5 py-3 text-right">value 合计</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.conversions.map((r) => (
                  <tr key={r.adId} className="border-b border-rule/40 last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/ads/${r.adId}/edit`} className="hover:text-ember-deep hover:underline">
                        {adIndex.get(r.adId)?.title ?? r.adId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{r.count}</td>
                    <td className="px-5 py-3 text-right font-mono text-ink-soft">
                      {r.totalValue > 0 ? r.totalValue : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/zones"
      className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
    >
      <ArrowLeft size={12} /> 回到广告位
    </Link>
  );
}

function BigStat({
  label,
  value,
  accent,
  sublabel,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rule/60 bg-paper p-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">{label}</span>
      <span className={`font-serif text-4xl ${accent ? 'text-ember-deep' : 'text-ink'}`}>{value}</span>
      {sublabel && <span className="mt-0.5 font-mono text-[10px] text-ink-soft/70">{sublabel}</span>}
    </div>
  );
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</p>
      <h2 className="mt-1.5 font-serif text-2xl tracking-tight">{title}</h2>
    </div>
  );
}

function EmptyCell({ hint }: { hint: string }) {
  return (
    <div className="rounded-xl border border-rule/60 bg-paper-deep/30 p-6 text-center text-sm text-ink-soft">
      {hint}
    </div>
  );
}
