'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProductFields, type ProductFieldValues } from '@/components/product-form';
import { ErrorBanner } from '@/components/ui/error-banner';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

export default function NewProductPage() {
  const router = useRouter();
  const api = useApi();
  const [values, setValues] = useState<ProductFieldValues>({ name: '', url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function patch(p: Partial<ProductFieldValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.products.create({ name: values.name, url: values.url, description: values.description || undefined });
      router.replace('/products');
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
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
      <h1 className="font-serif text-4xl tracking-tight">登记产品</h1>
      <p className="mt-3 text-ink-soft">把要推广的东西登记进来。之后创建广告时从产品列表里选。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <ProductFields
          values={values}
          onPatch={patch}
          nameHint="给人看的产品名，比如 ‘foo-cli’"
          descHint="可选。AI 生成广告文案时作为 context"
        />

        <ErrorBanner message={error} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '登记中…' : '登记产品'}
          </button>
          <Link
            prefetch={false}
            href="/products"
            className="inline-flex items-center rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft hover:border-ink hover:text-ink"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
