'use client';

import { ArrowLeft, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Zone } from '@muiad/db';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [audience, setAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        setCategory(z.category ?? '');
        setDescription(z.description ?? '');
        setTags(z.tags ?? '');
        setAudience(z.audience ?? '');
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
      await api.zones.update(id, {
        name,
        siteUrl,
        width,
        height,
        category: category || null,
        description: description || null,
        tags: tags || null,
        audience: audience || null,
      });
      router.replace('/zones');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      await api.zones.remove(id);
      router.replace('/zones');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
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

        <div className="rounded-xl border border-rule/60 bg-paper-deep/20 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember-deep">marketplace</p>
          <p className="mt-1 text-sm text-ink-soft">给 Agent / 其他用户看的描述，影响广告匹配质量。</p>
          <div className="mt-5 space-y-5">
            <Field label="分类">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="blog"
                className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </Field>
            <Field label="简介">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-rule bg-paper px-4 py-3 text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </Field>
            <Field label="标签">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai,devtools"
                className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </Field>
            <Field label="目标受众">
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</label>
      {children}
    </div>
  );
}
