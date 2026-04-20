'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function NewProductPage() {
  const router = useRouter();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setSubmitting(true);
    setError('');
    try {
      await api.products.create({ name, url, description: description || undefined });
      router.replace('/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到产品
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">登记产品</h1>
      <p className="mt-3 text-ink-soft">把要推广的东西登记进来。之后创建广告时从产品列表里选。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="名称" hint="给人看的产品名，比如 &lsquo;foo-cli&rsquo;">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>

        <Field label="产品 URL">
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://foo.dev"
            className={inputMonoClass}
          />
        </Field>

        <Field label="描述" hint="可选。AI 生成广告文案时作为 context">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '登记中…' : '登记产品'}
          </button>
          <Link
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
