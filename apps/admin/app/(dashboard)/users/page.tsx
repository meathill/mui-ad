'use client';

import { Trash } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useConfig } from '@/lib/store';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  createdAt: string | Date;
};

export default function UsersPage() {
  const { data: session } = authClient.useSession();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [claimResult, setClaimResult] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error: err } = await authClient.admin.listUsers({ query: { limit: 200 } });
    if (err) {
      setError(err.message ?? '加载失败');
      return;
    }
    setUsers((data?.users ?? []) as AdminUser[]);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await authClient.admin.createUser({
      email: newEmail.trim(),
      password: newPassword,
      name: newName.trim() || newEmail.trim(),
      role: 'user',
    });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? '创建失败');
      return;
    }
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    await load();
  }

  async function handleClaim() {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setClaiming(true);
    setClaimResult('');
    try {
      const res = await api.admin.claimOrphans();
      const { products, zones, ads, aiGenerations } = res.claimed;
      setClaimResult(`已认领：产品 ${products} · 广告位 ${zones} · 广告 ${ads} · AI 生成 ${aiGenerations}。`);
    } catch (e) {
      setClaimResult(e instanceof Error ? e.message : String(e));
    } finally {
      setClaiming(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error: err } = await authClient.admin.removeUser({ userId: deleteId });
    if (err) {
      setError(err.message ?? '删除失败');
      throw new Error(err.message);
    }
    setDeleteId(null);
    await load();
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">users</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">只有 admin 能看这里</h1>
        <p className="mt-4 text-ink-soft">让节点所有者把账号发给你。</p>
      </div>
    );
  }

  const target = deleteId ? (users?.find((u) => u.id === deleteId) ?? null) : null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">admin · users</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">用户</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        直接建号、设置初始密码，把凭据发给用户。他登录后去 <code className="font-mono text-[13px]">/account</code>{' '}
        改密码。
      </p>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

      <section className="mt-10 rounded-xl border border-rule/60 bg-paper-deep/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl tracking-tight">认领孤儿数据</h2>
            <p className="mt-1 text-sm text-ink-soft">
              迁移前就存在的产品/广告位/广告/AI 生成，归属会是 NULL。点击把它们全都归到你名下。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="shrink-0 rounded-full border border-ember/50 bg-ember/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-deep transition-colors hover:bg-ember/15 disabled:opacity-60"
          >
            {claiming ? '认领中…' : '认领孤儿数据'}
          </button>
        </div>
        {claimResult && (
          <p className="mt-4 rounded-md bg-paper px-4 py-3 font-mono text-xs text-ink-soft">{claimResult}</p>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-rule/60 bg-paper-deep/20 p-6">
        <h2 className="font-serif text-xl tracking-tight">创建新账号</h2>
        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="邮箱">
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="名称（可空）">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="初始密码（≥8 位）">
            <input
              type="text"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
            >
              {submitting ? '创建中…' : '创建'}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl tracking-tight">现有账号</h2>
        {users === null ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">加载中…</p>
        ) : (
          <ul className="mt-4 divide-y divide-rule/60 rounded-xl border border-rule/60">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-lg">{u.name}</span>
                    {u.role === 'admin' && (
                      <span className="rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-deep">
                        admin
                      </span>
                    )}
                    {u.id === session?.user.id && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">（你）</span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-ink-soft">{u.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(u.id)}
                  disabled={u.id === session?.user.id}
                  className="rounded-full p-2 text-ink-soft/70 transition-colors hover:text-danger-deep disabled:cursor-not-allowed disabled:opacity-40"
                  title={u.id === session?.user.id ? '不能删自己' : '删除'}
                >
                  <Trash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="删除这个账号？"
        description={target ? `${target.email} — 删除后 ta 名下的数据会孤立（Phase C 处理归属迁移）。` : ''}
        confirmLabel="删除"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
