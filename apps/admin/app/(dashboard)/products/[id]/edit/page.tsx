'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product } from '@muiad/db';
import { ProductFields, type ProductFieldValues } from '@/components/product-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorBanner, Loading } from '@/components/ui/error-banner';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const api = useApi();

  const [product, setProduct] = useState<Product | null>(null);
  const [values, setValues] = useState<ProductFieldValues>({ name: '', url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const rows = await api.products.list();
        const p = rows.find((r) => r.id === id);
        if (!p) {
          setError('找不到这个产品');
          return;
        }
        setProduct(p);
        setValues({ name: p.name, url: p.url, description: p.description ?? '' });
      } catch (e) {
        setError(errMsg(e));
      }
    })();
  }, [api, id]);

  function patch(p: Partial<ProductFieldValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.products.update(id, { name: values.name, url: values.url, description: values.description || null });
      router.replace('/products');
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await api.products.remove(id);
      router.replace('/products');
    } catch (e) {
      setError(errMsg(e));
      throw e;
    }
  }

  if (!product) {
    return <Loading text={error || '加载中…'} />;
  }

  return (
    <div className="max-w-2xl">
      <Link
        prefetch={false}
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到产品
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">编辑产品</h1>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{id}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <ProductFields values={values} onPatch={patch} descHint="可选" />

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
