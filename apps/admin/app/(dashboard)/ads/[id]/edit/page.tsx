'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Ad, Product, Zone } from '@muiad/db';
import { Sparkle } from '@phosphor-icons/react';
import { AdFields, ZonePicker, type AdFieldValues } from '@/components/ad-form';
import { AIBannerComposer } from '@/components/ai-banner-composer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass } from '@/components/ui/field';
import { ErrorBanner, Loading } from '@/components/ui/error-banner';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const api = useApi();

  const [ad, setAd] = useState<Ad | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fields, setFields] = useState<AdFieldValues>({ title: '', content: '', imageUrl: '', linkUrl: '', weight: 1 });
  const [zoneIds, setZoneIds] = useState<Set<string>>(new Set());
  const [initialZoneIds, setInitialZoneIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
        setFields({
          title: adRow.title,
          content: adRow.content ?? '',
          imageUrl: adRow.imageUrl ?? '',
          linkUrl: adRow.linkUrl,
          weight: adRow.weight,
        });
        const ids = new Set(adZones.map((z) => z.zoneId));
        setZoneIds(ids);
        setInitialZoneIds(ids);
      } catch (e) {
        setError(errMsg(e));
      }
    })();
  }, [api, id]);

  function patch(p: Partial<AdFieldValues>) {
    setFields((f) => ({ ...f, ...p }));
  }

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
    setSubmitting(true);
    setError('');
    try {
      await api.ads.update(id, {
        title: fields.title,
        content: fields.content || null,
        imageUrl: fields.imageUrl || null,
        linkUrl: fields.linkUrl,
        weight: fields.weight,
      });
      const toAttach = [...zoneIds].filter((zid) => !initialZoneIds.has(zid));
      const toDetach = [...initialZoneIds].filter((zid) => !zoneIds.has(zid));
      if (toAttach.length > 0) await api.ads.attach(id, toAttach, fields.weight);
      if (toDetach.length > 0) await api.ads.detach(id, toDetach);
      router.replace('/ads');
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await api.ads.remove(id);
      router.replace('/ads');
    } catch (e) {
      setError(errMsg(e));
      throw e;
    }
  }

  if (!ad) {
    return <Loading text={error || '加载中…'} />;
  }

  const product = products.find((p) => p.id === ad.productId);

  return (
    <div className="max-w-2xl">
      <Link
        prefetch={false}
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

        <AdFields
          values={fields}
          onPatch={patch}
          bannerHint="拖拽上传、粘贴 URL，或让 AI 基于当前产品重新生成并裁剪"
          bannerExtra={
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 bg-ember/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-deep transition-colors hover:bg-ember/15"
            >
              <Sparkle size={12} weight="fill" /> ✨ AI 生成
            </button>
          }
          composer={
            <AIBannerComposer
              open={aiOpen}
              onOpenChange={setAiOpen}
              product={ad ? (products.find((p) => p.id === ad.productId) ?? null) : null}
              adId={id}
              onResult={(url) => patch({ imageUrl: url })}
            />
          }
        />

        <ZonePicker
          title="投放广告位"
          zones={zones}
          selected={zoneIds}
          onToggle={toggleZone}
          meta={(z) => z.status}
          emptyHint={<p className="rounded-md border border-rule/60 p-4 text-sm text-ink-soft">暂无广告位。</p>}
        />

        <ErrorBanner message={error} />

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
              prefetch={false}
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
