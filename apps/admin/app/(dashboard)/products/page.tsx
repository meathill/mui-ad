'use client';

import { PencilSimple, Plus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@muiad/db';
import { ErrorBanner, Loading } from '@/components/ui/error-banner';
import { errMsg, formatHost } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function ProductsPage() {
  const api = useApi();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setProducts(await api.products.list());
    } catch (e) {
      setError(errMsg(e));
    }
  }, [api]);

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
          prefetch={false}
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
        >
          <Plus size={12} weight="bold" /> 登记
        </Link>
      </div>

      <ErrorBanner message={error} className="mt-6" />

      <div className="mt-8 overflow-hidden rounded-xl border border-rule/60">
        {products === null ? (
          <Loading className="p-10" />
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-serif text-xl text-ink">还没有登记产品</p>
            <p className="mt-2 text-sm text-ink-soft">先登记一个产品，用来挂广告。</p>
            <Link
              prefetch={false}
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
                    <Link
                      prefetch={false}
                      href={`/products/${p.id}/edit`}
                      className="group/name block hover:text-ember-deep"
                    >
                      <div className="font-medium underline-offset-4 group-hover/name:underline">{p.name}</div>
                      <div className="font-mono text-[10px] text-ink-soft/70">{p.id}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-[12px] text-ink-soft">
                    <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-ember-deep hover:underline">
                      {formatHost(p.url)}
                    </a>
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-ink-soft" title={p.description ?? ''}>
                    {p.description ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      prefetch={false}
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
