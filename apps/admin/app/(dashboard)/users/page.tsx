'use client';

import { Trash } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, inputClass } from '@/components/ui/field';
import { type AdminUserDto, apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';
import { useAuthMode } from '@/lib/use-auth-mode';

export default function UsersPage() {
  const { isOperator } = useAuthMode();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [users, setUsers] = useState<AdminUserDto[] | null>(null);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    try {
      setUsers(await api.admin.listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
  }, [workerUrl, apiKey]);

  useEffect(() => {
    // 用户管理仅站长（root key）可用。
    if (isOperator) load();
  }, [isOperator, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const api = apiFromConfig(workerUrl, apiKey);
    try {
      await api?.admin.createUser({
        email: newEmail.trim(),
        password: newPassword,
        name: newName.trim() || newEmail.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      return;
    } finally {
      setSubmitting(false);
    }
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    await load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const api = apiFromConfig(workerUrl, apiKey);
    try {
      await api?.admin.deleteUser(deleteId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除失败';
      setError(message);
      throw new Error(message);
    }
    setDeleteId(null);
    await load();
  }

  if (!isOperator) {
    return (
      <div className="max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">users</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">只有站长能管理用户</h1>
        <p className="mt-4 text-ink-soft">用站长密钥（root）登录后才能在这里建号、删号。</p>
      </div>
    );
  }

  const target = deleteId ? (users?.find((u) => u.id === deleteId) ?? null) : null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">root · users</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">用户</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        直接建号、设置初始密码，把凭据发给用户。他登录后去 <code className="font-mono text-[13px]">/account</code>{' '}
        改密码。所有账号都是普通用户。
      </p>

      {error && <p className="mt-6 rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

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
                  <div className="truncate font-serif text-lg">{u.name}</div>
                  <div className="truncate font-mono text-[11px] text-ink-soft">{u.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(u.id)}
                  className="rounded-full p-2 text-ink-soft/70 transition-colors hover:text-danger-deep"
                  title="删除"
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
        description={target ? `${target.email} — 删除后 ta 名下的数据会孤立。` : ''}
        confirmLabel="删除"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
