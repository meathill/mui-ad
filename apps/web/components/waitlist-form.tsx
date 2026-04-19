'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setErrorMessage(mapError(response.status, data.error));
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMessage('网络好像断了，稍后再试一次？');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        id="waitlist"
        className="flex items-start gap-3 rounded-2xl border border-ember/40 bg-ember/10 px-5 py-4 text-ink"
      >
        <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-ember-deep" />
        <div>
          <p className="font-serif text-xl">收到啦 ✺</p>
          <p className="mt-1 text-sm text-ink-soft">我们会在每一个新版本发布前给你写信——不营销、不转卖、随时退订。</p>
        </div>
      </div>
    );
  }

  return (
    <form id="waitlist" onSubmit={handleSubmit} className="group">
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        留个邮箱，第一时间上车
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'submitting'}
          placeholder="you@somewhere.dev"
          className="flex-1 rounded-full border border-rule bg-paper px-5 py-3 font-mono text-sm text-ink placeholder:text-ink-soft/60 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
        >
          {status === 'submitting' ? '提交中…' : '加入'}
          {status !== 'submitting' && <ArrowRight size={14} weight="bold" />}
        </button>
      </div>
      {errorMessage && <p className="mt-3 font-mono text-xs text-ember-deep">{errorMessage}</p>}
    </form>
  );
}

function mapError(code: number, raw: string | undefined) {
  if (code === 409) return '这个邮箱已经在列表里啦——我们记下你了。';
  if (code === 400) return '这个邮箱好像不太对，检查一下？';
  return raw || '服务器打了个盹，稍后再试一次。';
}
