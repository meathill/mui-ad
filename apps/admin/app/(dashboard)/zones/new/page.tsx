'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

const PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: '300×250 矩形', w: 300, h: 250 },
  { label: '728×90 横幅', w: 728, h: 90 },
  { label: '160×600 长条', w: 160, h: 600 },
  { label: '320×50 移动', w: 320, h: 50 },
];

export default function NewZonePage() {
  const router = useRouter();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [name, setName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(250);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) {
      setError('配置丢失，请回到首页');
      setSubmitting(false);
      return;
    }
    try {
      const { zone } = await api.zones.create({ name, siteUrl, width, height });
      router.replace(`/zones?created=${zone.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/zones"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到广告位
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">新建广告位</h1>
      <p className="mt-3 text-ink-soft">填好这四项就能拿到嵌入代码，贴到你的网站上。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="名称" hint="给自己看的识别名，比如 &lsquo;博客侧边栏&rsquo;">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </Field>

        <Field label="所属站点 URL">
          <input
            required
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://yourblog.dev"
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </Field>

        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">尺寸</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setWidth(p.w);
                  setHeight(p.h);
                }}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  width === p.w && height === p.h
                    ? 'border-ember bg-ember/15 text-ember-deep'
                    : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              required
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-28 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
            />
            <span className="self-center font-mono text-ink-soft">×</span>
            <input
              type="number"
              min={1}
              required
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-28 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
            />
            <span className="self-center font-mono text-xs text-ink-soft">px</span>
          </div>
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '创建中…' : '创建广告位'}
          </button>
          <Link
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
