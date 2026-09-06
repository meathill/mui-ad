'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product, Zone } from '@muiad/db';
import { Sparkle } from '@phosphor-icons/react';
import { AdFields, ZonePicker, type AdFieldValues } from '@/components/ad-form';
import { AIBannerComposer } from '@/components/ai-banner-composer';
import { Field, inputClass } from '@/components/ui/field';
import { ErrorBanner, Loading } from '@/components/ui/error-banner';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function NewAdPage() {
  const router = useRouter();
  const api = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [productId, setProductId] = useState('');
  const [fields, setFields] = useState<AdFieldValues>({ title: '', content: '', imageUrl: '', linkUrl: '', weight: 1 });
  const [zoneIds, setZoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [productList, zoneList] = await Promise.all([api.products.list(), api.zones.list()]);
        setProducts(productList);
        setZones(zoneList.filter((z) => z.status === 'active'));
        if (productList.length > 0 && productList[0]) {
          setProductId(productList[0].id);
          setFields((f) => (f.linkUrl ? f : { ...f, linkUrl: productList[0].url }));
        }
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  function patch(p: Partial<AdFieldValues>) {
    setFields((f) => ({ ...f, ...p }));
  }

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
    setSubmitting(true);
    setError('');
    try {
      await api.ads.create({
        productId,
        title: fields.title,
        content: fields.content || undefined,
        imageUrl: fields.imageUrl || undefined,
        linkUrl: fields.linkUrl,
        weight: fields.weight,
        zoneIds: Array.from(zoneIds),
      });
      router.replace('/ads');
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (products.length === 0) {
    return (
      <div className="max-w-2xl">
        <Link
          prefetch={false}
          href="/ads"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={12} /> 回到广告
        </Link>
        <h1 className="font-serif text-4xl tracking-tight">需要先登记产品</h1>
        <p className="mt-4 text-ink-soft">广告必须挂在一个产品下。先去登记产品再回来。</p>
        <Link
          prefetch={false}
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
        prefetch={false}
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
              if (p) setFields((f) => (f.linkUrl ? f : { ...f, linkUrl: p.url }));
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

        <AdFields
          values={fields}
          onPatch={patch}
          bannerHint="可选。拖拽上传、粘贴 URL，或让 AI 基于产品生成再裁剪"
          bannerExtra={
            productId ? (
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 bg-ember/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-deep transition-colors hover:bg-ember/15"
              >
                <Sparkle size={12} weight="fill" /> ✨ AI 生成
              </button>
            ) : undefined
          }
          composer={
            <AIBannerComposer
              open={aiOpen}
              onOpenChange={setAiOpen}
              product={products.find((p) => p.id === productId) ?? null}
              onResult={(url) => patch({ imageUrl: url })}
            />
          }
        />

        <ZonePicker
          title="投放到哪些广告位"
          zones={zones}
          selected={zoneIds}
          onToggle={toggleZone}
          meta={(z) => z.siteUrl.replace(/^https?:\/\//, '')}
          emptyHint={
            <p className="rounded-md border border-rule/60 p-4 text-sm text-ink-soft">
              还没有可用广告位（active 状态）。先去{' '}
              <Link prefetch={false} href="/zones/new" className="underline">
                创建一个
              </Link>
              。
            </p>
          }
        />

        <ErrorBanner message={error} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !productId}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '创建中…' : '创建广告'}
          </button>
          <Link
            prefetch={false}
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
