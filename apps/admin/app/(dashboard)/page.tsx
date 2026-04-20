'use client';

import { ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

type Counts = { zones: number; products: number; ads: number };

export default function Overview() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const [zones, products, ads] = await Promise.all([api.zones.list(), api.products.list(), api.ads.list()]);
        setCounts({ zones: zones.length, products: products.length, ads: ads.length });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [workerUrl, apiKey]);

  return (
    <div>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">01 · overview</p>
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
        这个节点
        <br />
        现在有什么。
      </h1>

      {error && (
        <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">读取数据失败：{error}</p>
      )}

      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="广告位" value={counts?.zones} href="/zones" />
        <StatCard label="产品" value={counts?.products} href="/products" />
        <StatCard label="广告" value={counts?.ads} href="/ads" />
      </section>

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">02 · quick start</p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight">从这里开始。</h2>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ActionCard href="/zones/new" title="创建广告位" hint="拿到嵌入代码贴到你的站点" />
          <ActionCard href="/products/new" title="登记产品" hint="把要推广的项目登记进来" />
          <ActionCard href="/ads/new" title="创建广告" hint="选产品 → 选广告位 → 投放" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number | undefined; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-rule/60 bg-paper p-6 transition-colors hover:border-ember/60"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">{label}</span>
      <span className="font-serif text-5xl text-ink">{value ?? '—'}</span>
      <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ember-deep opacity-60 transition-opacity group-hover:opacity-100">
        查看 <ArrowRight size={12} weight="bold" />
      </span>
    </Link>
  );
}

function ActionCard({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-rule/60 bg-paper-deep/50 p-5 transition-colors hover:border-ember/60"
    >
      <span className="font-serif text-xl text-ink">{title}</span>
      <span className="text-sm text-ink-soft">{hint}</span>
      <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ember-deep">
        开始 <ArrowRight size={12} weight="bold" />
      </span>
    </Link>
  );
}
