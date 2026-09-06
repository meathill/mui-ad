'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Zone } from '@muiad/db';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorBanner, Loading } from '@/components/ui/error-banner';
import { ZoneForm, type ZoneFormValues } from '@/components/zone-form';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function EditZonePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const api = useApi();

  const [zone, setZone] = useState<Zone | null>(null);
  const [values, setValues] = useState<ZoneFormValues>({
    name: '',
    siteUrl: '',
    width: 300,
    height: 250,
    category: '',
    description: '',
    tags: '',
    audience: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { zone: z } = await api.zones.get(id);
        setZone(z);
        setValues({
          name: z.name,
          siteUrl: z.siteUrl,
          width: z.width,
          height: z.height,
          category: z.category ?? '',
          description: z.description ?? '',
          tags: z.tags ?? '',
          audience: z.audience ?? '',
        });
      } catch (e) {
        setError(errMsg(e));
      }
    })();
  }, [api, id]);

  function patch(p: Partial<ZoneFormValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.zones.update(id, {
        name: values.name,
        siteUrl: values.siteUrl,
        width: values.width,
        height: values.height,
        category: values.category || null,
        description: values.description || null,
        tags: values.tags || null,
        audience: values.audience || null,
      });
      router.replace('/zones');
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await api.zones.remove(id);
      router.replace('/zones');
    } catch (e) {
      setError(errMsg(e));
      throw e;
    }
  }

  if (error && !zone) {
    return (
      <div className="max-w-2xl">
        <Link
          prefetch={false}
          href="/zones"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={12} /> 回到广告位
        </Link>
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!zone) {
    return <Loading />;
  }

  return (
    <div className="max-w-2xl">
      <Link
        prefetch={false}
        href="/zones"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到广告位
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">编辑广告位</h1>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{id}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <ZoneForm values={values} onPatch={patch} marketplaceHint="给 Agent / 其他用户看的描述，影响广告匹配质量。" />

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
              href="/zones"
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
            <Trash size={12} />
            删除
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除这个广告位？"
        description={`「${zone.name}」的投放关系会一起清掉，相关的展示/点击历史保留但不再关联。这个操作不能撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
