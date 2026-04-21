'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? '登录失败');
      return;
    }
    router.replace('/');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">MuiAD // login</p>
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
        欢迎<em className="italic text-ember-deep">回来</em>。
      </h1>
      <p className="mt-5 text-ink-soft">用邮箱和密码登录你的节点账号。</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
          >
            {submitting ? '正在登录…' : '登录'}
          </button>
          <Link
            href="/signup"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ember-deep"
          >
            没账号？注册 →
          </Link>
        </div>
      </form>
    </div>
  );
}
