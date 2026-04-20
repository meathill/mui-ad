'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product, Zone } from '@muiad/db';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function NewAdPage() {
  const router = useRouter();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);

  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [productId, setProductId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [weight, setWeight] = useState(1);
  const [zoneIds, setZoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const [productList, zoneList] = await Promise.all([api.products.list(), api.zones.list()]);
        setProducts(productList);
        setZones(zoneList.filter((z) => z.status === 'active'));
        if (productList.length > 0 && productList[0]) {
          setProductId(productList[0].id);
          if (!linkUrl) setLinkUrl(productList[0].url);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerUrl, apiKey]);

  function toggleZone(id: string) {
    setZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setSubmitting(true);
    setError('');
    try {
      await api.ads.create({
        productId,
        title,
        content: content || undefined,
        imageUrl: imageUrl || undefined,
        linkUrl,
        weight,
        zoneIds: Array.from(zoneIds),
      });
      router.replace('/ads');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>;
  }

  if (products.length === 0) {
    return (
      <div className="max-w-2xl">
        <Link
          href="/ads"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={12} /> 回到广告
        </Link>
        <h1 className="font-serif text-4xl tracking-tight">需要先登记产品</h1>
        <p className="mt-4 text-ink-soft">广告必须挂在一个产品下。先去登记产品再回来。</p>
        <Link
          href="/products/new"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
        >
          登记产品 →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/ads"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到广告
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">创建广告</h1>
      <p className="mt-3 text-ink-soft">选产品 → 填文案 → 勾选要投放的广告位。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="产品">
          <select
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              const p = products.find((p) => p.id === e.target.value);
              if (p && !linkUrl) setLinkUrl(p.url);
            }}
            className={inputClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="标题" hint="一行简短的卖点，出现在广告卡片顶部">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>

        <Field label="文案" hint="可选，小字描述">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Banner 图片 URL" hint="可选">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={inputMonoClass}
          />
        </Field>

        <Field label="落地页 URL">
          <input
            required
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className={inputMonoClass}
          />
        </Field>

        <Field label="权重" hint="同一广告位下，高权重被选中概率更大；默认 1">
          <input
            type="number"
            min={1}
            required
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className={`${inputMonoClass} w-32`}
          />
        </Field>

        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            投放到哪些广告位
          </label>
          {zones.length === 0 ? (
            <p className="rounded-md border border-rule/60 p-4 text-sm text-ink-soft">
              还没有可用广告位（active 状态）。先去{' '}
              <Link href="/zones/new" className="underline">
                创建一个
              </Link>
              。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {zones.map((z) => (
                <label
                  key={z.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    zoneIds.has(z.id) ? 'border-ember bg-ember/10' : 'border-rule hover:border-ink/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={zoneIds.has(z.id)}
                    onChange={() => toggleZone(z.id)}
                    className="accent-ember-deep"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{z.name}</div>
                    <div className="font-mono text-[10px] text-ink-soft">
                      {z.width}×{z.height} · {z.siteUrl.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !productId}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '创建中…' : '创建广告'}
          </button>
          <Link
            href="/ads"
            className="inline-flex items-center rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft hover:border-ink hover:text-ink"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
