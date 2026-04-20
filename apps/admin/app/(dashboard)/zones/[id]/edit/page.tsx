'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Zone } from '@muiad/db';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

const PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: '300×250 矩形', w: 300, h: 250 },
  { label: '728×90 横幅', w: 728, h: 90 },
  { label: '160×600 长条', w: 160, h: 600 },
  { label: '320×50 移动', w: 320, h: 50 },
];

export default function EditZonePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);

  const [zone, setZone] = useState<Zone | null>(null);
  const [name, setName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(250);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    (async () => {
      try {
        const { zone: z } = await api.zones.get(id);
        setZone(z);
        setName(z.name);
        setSiteUrl(z.siteUrl);
        setWidth(z.width);
        setHeight(z.height);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [workerUrl, apiKey, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) {
      setSubmitting(false);
      return;
    }
    try {
      await api.zones.update(id, { name, siteUrl, width, height });
      router.replace('/zones');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('确认删除这个广告位？相关的投放关系和统计数据都会受影响。')) return;
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setDeleting(true);
    try {
      await api.zones.remove(id);
      router.replace('/zones');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  if (error && !zone) {
    return (
      <div className="max-w-2xl">
        <Link
          href="/zones"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={12} /> 回到广告位
        </Link>
        <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>
      </div>
    );
  }

  if (!zone) {
    return <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>;
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/zones"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={12} /> 回到广告位
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">编辑广告位</h1>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">{id}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <Field label="名称">
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
              href="/zones"
              className="inline-flex items-center rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft hover:border-ink hover:text-ink"
            >
              取消
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-ember-deep hover:text-ember-deep disabled:opacity-50"
          >
            <Trash size={12} />
            {deleting ? '删除中…' : '删除'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</label>
      {children}
    </div>
  );
}
