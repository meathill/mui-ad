'use client';

import { Trash } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import type { AiGeneration, Product } from '@muiad/db';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function AiGenerationsPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [rows, setRows] = useState<AiGeneration[] | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      const [list, productList] = await Promise.all([api.aiGenerations.list({ limit: 100 }), api.products.list()]);
      setRows(list);
      setProducts(new Map(productList.map((p) => [p.id, p])));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (deleteId === null) return;
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      await api.aiGenerations.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  const target = deleteId !== null ? (rows?.find((r) => r.id === deleteId) ?? null) : null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">ai · history</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">AI 生成历史</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        所有通过 AI banner composer 生成的图片都在这里。原图和裁剪版都保留在 R2，可以重复使用或删除释放空间。
      </p>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      {rows === null ? (
        <div className="mt-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-rule/60 bg-paper-deep/30 p-10 text-center">
          <p className="font-serif text-xl text-ink">还没有 AI 生成过图片</p>
          <p className="mt-2 text-sm text-ink-soft">
            去广告表单里点 "✨ AI 生成" 就能让 OpenAI 或 Gemini 出一张，裁剪后自动落这里。
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rows.map((row) => (
            <GenerationCard
              key={row.id}
              row={row}
              workerUrl={workerUrl}
              productName={row.productId ? products.get(row.productId)?.name : undefined}
              onDelete={() => setDeleteId(row.id)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="删除这条 AI 生成记录？"
        description={
          target
            ? `${target.provider} · ${target.model} — 删除后历史记录消失，R2 里的图片文件保留（不会自动清理）。`
            : ''
        }
        confirmLabel="删除"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function GenerationCard({
  row,
  workerUrl,
  productName,
  onDelete,
}: {
  row: AiGeneration;
  workerUrl: string | null;
  productName?: string;
  onDelete: () => void;
}) {
  const base = workerUrl ?? '';
  const displayUrl = `${base}/files/${row.croppedKey ?? row.originalKey}`;
  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-rule/60 bg-paper">
      {/* biome-ignore lint/performance/noImgElement: small preview, no Next optimization binding here */}
      <img
        src={displayUrl}
        alt={row.prompt.slice(0, 60)}
        className="aspect-square w-full bg-paper-deep/40 object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-deep">
          <span>{row.provider}</span>
          <span className="text-ink-soft/60">·</span>
          <span className="truncate text-ink-soft" title={row.model}>
            {row.model}
          </span>
        </div>
        <p className="line-clamp-2 text-[13px] text-ink-soft">{row.prompt}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="font-mono text-[10px] text-ink-soft/70">
            {productName ?? '—'}
            {row.width && row.height ? ` · ${row.width}×${row.height}` : ''}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-1.5 text-ink-soft/60 opacity-0 transition-opacity hover:text-danger-deep group-hover:opacity-100"
            title="删除记录"
          >
            <Trash size={12} />
          </button>
        </div>
      </div>
    </li>
  );
}
