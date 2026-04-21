'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient, workerBaseURL } from '@/lib/auth-client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gateState, setGateState] = useState<'loading' | 'open' | 'closed'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${workerBaseURL}/auth-meta`, { credentials: 'include' });
        const json = (await res.json()) as { signupOpen: boolean };
        setGateState(json.signupOpen ? 'open' : 'closed');
      } catch {
        setGateState('closed');
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await authClient.signUp.email({ email, password, name });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? '注册失败');
      return;
    }
    router.replace('/');
  }

  if (gateState === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        加载中…
      </div>
    );
  }

  if (gateState === 'closed') {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">MuiAD // signup closed</p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
          这个节点不<em className="italic text-ember-deep">开放注册</em>。
        </h1>
        <p className="mt-5 text-ink-soft">账号由节点管理员创建后发给你，拿到凭据后直接登录，进去先改密码。</p>
        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep"
          >
            去登录 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">MuiAD // bootstrap</p>
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
        初始化<em className="italic text-ember-deep">节点所有者</em>。
      </h1>
      <p className="mt-5 text-ink-soft">
        这是节点的第一个账号，自动成为 admin。之后新用户只能由你在 <code className="font-mono text-[13px]">/users</code>{' '}
        手动创建。
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            名称
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

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
            密码（至少 8 位）
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !email || !password || !name}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
        >
          {submitting ? '正在创建…' : '创建 admin 账号'}
        </button>
      </form>
    </div>
  );
}
