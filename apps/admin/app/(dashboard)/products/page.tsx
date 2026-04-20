'use client';

import { PencilSimple, Plus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function ProductsPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      setProducts(await api.products.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">products</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">产品</h1>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
        >
          <Plus size={12} weight="bold" /> 登记
        </Link>
      </div>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-xl border border-rule/60">
        {products === null ? (
          <div className="p-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-serif text-xl text-ink">还没有登记产品</p>
            <p className="mt-2 text-sm text-ink-soft">先登记一个产品，用来挂广告。</p>
            <Link
              href="/products/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
            >
              <Plus size={12} weight="bold" /> 登记第一个
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-rule/60 bg-paper-deep/40 text-ink-soft">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em]">
                <th className="px-5 py-3">名称</th>
                <th className="px-5 py-3">URL</th>
                <th className="px-5 py-3">描述</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-rule/40 last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="font-mono text-[10px] text-ink-soft/70">{p.id}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[12px] text-ink-soft">
                    <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-ember-deep hover:underline">
                      {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-ink-soft" title={p.description ?? ''}>
                    {p.description ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-rule/40 hover:text-ink"
                    >
                      <PencilSimple size={12} /> 编辑
                    </Link>
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
