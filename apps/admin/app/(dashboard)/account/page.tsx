'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field, inputClass } from '@/components/ui/field';
import { authClient } from '@/lib/auth-client';

export default function AccountPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    setSubmitting(true);
    const { error: err } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? '修改失败');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setOk('密码已更新，其他设备的会话已失效。');
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.replace('/login');
  }

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">account</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">账号</h1>

      {session?.user && (
        <div className="mt-8 rounded-xl border border-rule/60 bg-paper-deep/20 p-6">
          <div className="font-serif text-lg">{session.user.name}</div>
          <div className="mt-1 font-mono text-[11px] text-ink-soft">{session.user.email}</div>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-xl tracking-tight">修改密码</h2>
        <form onSubmit={handleChange} className="mt-5 space-y-5">
          <Field label="当前密码">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="新密码（≥8 位）">
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}
          {ok && <p className="rounded-md bg-grass/10 px-4 py-3 font-mono text-xs text-grass-deep">{ok}</p>}

          <button
            type="submit"
            disabled={submitting || !currentPassword || newPassword.length < 8}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '更新中…' : '更新密码'}
          </button>
        </form>
      </section>

      <section className="mt-12 border-t border-rule/60 pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:border-ink hover:text-ink"
        >
          退出登录
        </button>
      </section>
    </div>
  );
}
