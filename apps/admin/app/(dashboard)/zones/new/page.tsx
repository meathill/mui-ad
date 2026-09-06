'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ZoneForm, type ZoneFormValues } from '@/components/zone-form';
import { ErrorBanner } from '@/components/ui/error-banner';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';

const INITIAL: ZoneFormValues = {
  name: '',
  siteUrl: '',
  width: 300,
  height: 250,
  category: '',
  description: '',
  tags: '',
  audience: '',
};

export default function NewZonePage() {
  const router = useRouter();
  const api = useApi();
  const [values, setValues] = useState<ZoneFormValues>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function patch(p: Partial<ZoneFormValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { zone } = await api.zones.create({
        name: values.name,
        siteUrl: values.siteUrl,
        width: values.width,
        height: values.height,
        category: values.category || undefined,
        description: values.description || undefined,
        tags: values.tags || undefined,
        audience: values.audience || undefined,
      });
      router.replace(`/zones?created=${zone.id}`);
    } catch (e) {
      setError(errMsg(e));
      setSubmitting(false);
    }
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
      <h1 className="font-serif text-4xl tracking-tight">新建广告位</h1>
      <p className="mt-3 text-ink-soft">填好这四项就能拿到嵌入代码，贴到你的网站上。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <ZoneForm
          values={values}
          onPatch={patch}
          marketplaceHint="下面是给 Agent / 其他用户看的。填得越清楚，匹配的广告越贴。可以之后再补。"
        />

        <ErrorBanner message={error} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '创建中…' : '创建广告位'}
          </button>
          <Link
            prefetch={false}
            href="/zones"
            className="inline-flex items-center rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft hover:border-ink hover:text-ink"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
