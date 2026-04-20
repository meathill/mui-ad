'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product } from '@muiad/db';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const rows = await api.products.list();
        const p = rows.find((r) => r.id === id);
        if (!p) {
          setError('找不到这个产品');
          return;
        }
        setProduct(p);
        setName(p.name);
        setUrl(p.url);
        setDescription(p.description ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [workerUrl, apiKey, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setSubmitting(true);
    setError('');
    try {
      await api.products.update(id, { name, url, description: description || null });
      router.replace('/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      await api.products.remove(id);
      router.replace('/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  if (!product) {
    return (
      <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{error || '加载中…'}</div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到产品
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">编辑产品</h1>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{id}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="名称">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="产品 URL">
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputMonoClass} />
        </Field>
        <Field label="描述" hint="可选">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

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
              href="/products"
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
        title="删除这个产品？"
        description={`「${product.name}」删除后，关联的广告会因为外键约束失败——先把相关广告删掉再删产品。这个操作不能撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
