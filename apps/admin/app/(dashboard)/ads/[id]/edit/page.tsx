'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Ad, Product, Zone } from '@muiad/db';
import { Sparkle } from '@phosphor-icons/react';
import { AIBannerComposer } from '@/components/ai-banner-composer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { UploadInput } from '@/components/ui/upload-input';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);

  const [ad, setAd] = useState<Ad | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [weight, setWeight] = useState(1);
  const [zoneIds, setZoneIds] = useState<Set<string>>(new Set());
  const [initialZoneIds, setInitialZoneIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const [adRow, productList, zoneList, adZones] = await Promise.all([
          api.ads.get(id),
          api.products.list(),
          api.zones.list(),
          api.ads.listZones(id),
        ]);
        setAd(adRow);
        setProducts(productList);
        setZones(zoneList);
        setTitle(adRow.title);
        setContent(adRow.content ?? '');
        setImageUrl(adRow.imageUrl ?? '');
        setLinkUrl(adRow.linkUrl);
        setWeight(adRow.weight);
        const ids = new Set(adZones.map((z) => z.zoneId));
        setZoneIds(ids);
        setInitialZoneIds(ids);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [workerUrl, apiKey, id]);

  function toggleZone(zid: string) {
    setZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(zid)) next.delete(zid);
      else next.add(zid);
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
      await api.ads.update(id, {
        title,
        content: content || null,
        imageUrl: imageUrl || null,
        linkUrl,
        weight,
      });
      const toAttach = [...zoneIds].filter((zid) => !initialZoneIds.has(zid));
      const toDetach = [...initialZoneIds].filter((zid) => !zoneIds.has(zid));
      if (toAttach.length > 0) await api.ads.attach(id, toAttach, weight);
      if (toDetach.length > 0) await api.ads.detach(id, toDetach);
      router.replace('/ads');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      await api.ads.remove(id);
      router.replace('/ads');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  if (!ad) {
    return (
      <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{error || '加载中…'}</div>
    );
  }

  const product = products.find((p) => p.id === ad.productId);

  return (
    <div className="max-w-2xl">
      <Link
        href="/ads"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到广告
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">编辑广告</h1>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{id}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="产品">
          <div className={`${inputClass} bg-paper-deep/40 text-ink-soft`}>
            {product?.name ?? '—'}
            <span className="ml-2 font-mono text-[10px] text-ink-soft/70">（不可修改）</span>
          </div>
        </Field>

        <Field label="标题">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>

        <Field label="文案">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Banner 图片" hint="拖拽上传、粘贴 URL，或让 AI 基于当前产品重新生成并裁剪">
          <UploadInput
            value={imageUrl}
            onChange={setImageUrl}
            extraAction={
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 bg-ember/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-deep transition-colors hover:bg-ember/15"
              >
                <Sparkle size={12} weight="fill" /> ✨ AI 生成
              </button>
            }
          />
        </Field>

        <AIBannerComposer
          open={aiOpen}
          onOpenChange={setAiOpen}
          product={ad ? (products.find((p) => p.id === ad.productId) ?? null) : null}
          adId={id}
          onResult={(url) => setImageUrl(url)}
        />

        <Field label="落地页 URL">
          <input
            required
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className={inputMonoClass}
          />
        </Field>

        <Field label="权重">
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
            投放广告位
          </label>
          {zones.length === 0 ? (
            <p className="rounded-md border border-rule/60 p-4 text-sm text-ink-soft">暂无广告位。</p>
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
                      {z.width}×{z.height} · {z.status}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
            >
              {submitting ? '保存中…' : '保存更改'}
            </button>
            <Link
              href="/ads"
              className="inline-flex items-center rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft hover:border-ink hover:text-ink"
            >
              取消
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-danger-deep transition-colors hover:bg-danger hover:text-paper"
          >
            <Trash size={12} /> 删除
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除这条广告？"
        description={`「${ad.title}」会从所有广告位下架，展示/点击历史保留。这个操作不能撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
