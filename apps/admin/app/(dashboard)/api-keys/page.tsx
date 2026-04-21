'use client';

import { Copy, Trash } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import type { ApiKeyPublic } from '@muiad/db';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

export default function ApiKeysPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [keys, setKeys] = useState<ApiKeyPublic[] | null>(null);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [freshlyCreated, setFreshlyCreated] = useState<{ key: ApiKeyPublic; raw: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      setKeys(await api.apiKeys.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await api.apiKeys.create(newName.trim() || 'Untitled key');
      setFreshlyCreated(result);
      setNewName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRevoke() {
    if (!revokeId) return;
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      await api.apiKeys.revoke(revokeId);
      setRevokeId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  async function copyRaw() {
    if (!freshlyCreated) return;
    await navigator.clipboard.writeText(freshlyCreated.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const active = keys?.filter((k) => !k.revokedAt) ?? [];
  const revoked = keys?.filter((k) => k.revokedAt) ?? [];
  const target = revokeId ? (keys?.find((k) => k.id === revokeId) ?? null) : null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">api · keys</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">API Keys</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        用来从 MCP / CI / 脚本调你自己的 API。生成的 key 只显示一次——关闭对话框后就再也看不到了。丢了就撤销重发。
      </p>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      {freshlyCreated && (
        <section className="mt-8 rounded-xl border-2 border-ember/50 bg-ember/5 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">⚠ 仅此一次可见</p>
          <h2 className="mt-2 font-serif text-xl tracking-tight">新 key：{freshlyCreated.key.name}</h2>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-paper px-4 py-3 font-mono text-sm">
              {freshlyCreated.raw}
            </code>
            <button
              type="button"
              onClick={copyRaw}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-paper"
            >
              <Copy size={12} /> {copied ? '已复制' : '复制'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFreshlyCreated(null)}
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft underline-offset-4 hover:text-ember-deep hover:underline"
          >
            我已经保存好了 —
          </button>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-rule/60 bg-paper-deep/20 p-6">
        <h2 className="font-serif text-xl tracking-tight">生成新 key</h2>
        <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
          <Field label="名字（给自己记的）" hint="比如 'MCP on laptop' 或 'CI deploy'">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Untitled key"
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '生成中…' : '生成'}
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl tracking-tight">现有 key</h2>
        {keys === null ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</p>
        ) : active.length === 0 ? (
          <p className="mt-4 rounded-md border border-rule/60 bg-paper-deep/20 p-6 text-sm text-ink-soft">
            还没生成过 API key。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-rule/60 rounded-xl border border-rule/60">
            {active.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="font-serif text-lg">{k.name}</div>
                  <div className="font-mono text-[11px] text-ink-soft">
                    {k.prefix}…
                    {k.lastUsedAt ? ` · 最近使用 ${new Date(k.lastUsedAt).toLocaleString('zh-CN')}` : ' · 从未使用'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRevokeId(k.id)}
                  className="rounded-full p-2 text-ink-soft/70 transition-colors hover:text-danger-deep"
                  title="撤销"
                >
                  <Trash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {revoked.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-lg tracking-tight text-ink-soft">已撤销</h2>
          <ul className="mt-3 divide-y divide-rule/60 rounded-xl border border-rule/40 bg-paper-deep/10">
            {revoked.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-4 px-5 py-3 opacity-60">
                <div className="min-w-0">
                  <div className="truncate text-sm">{k.name}</div>
                  <div className="font-mono text-[10px] text-ink-soft">
                    {k.prefix}… · 撤销于 {k.revokedAt ? new Date(k.revokedAt).toLocaleString('zh-CN') : '—'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={revokeId !== null}
        onOpenChange={(v) => !v && setRevokeId(null)}
        title="撤销这个 API key？"
        description={target ? `「${target.name}」立即失效，已经在用它的脚本/MCP 会开始拿到 401。` : ''}
        confirmLabel="撤销"
        destructive
        onConfirm={confirmRevoke}
      />
    </div>
  );
}
