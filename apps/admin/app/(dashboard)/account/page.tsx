'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Field, inputClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useConfig } from '@/lib/store';

type ApprovalMode = 'auto' | 'manual' | 'warm' | 'ai';

const MODES: Array<{ value: ApprovalMode; label: string; hint: string }> = [
  { value: 'auto', label: '自动上线', hint: '任何广告主挂到你的 zone，立刻开始展示。' },
  { value: 'manual', label: '审批后上线', hint: '每个新广告都进"待审核"，你点批准才开始展示。' },
  {
    value: 'warm',
    label: '有在线广告就自动',
    hint: 'zone 已经有 active 广告时，新广告直通；否则 pending。',
  },
  {
    value: 'ai',
    label: 'Workers AI 自动审核',
    hint: '调 Workers AI 给广告打分，没严重问题就放行（Step 2b 才真的接上，现在等同"审批后上线"）。',
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [mode, setMode] = useState<ApprovalMode | null>(null);
  const [modeSaving, setModeSaving] = useState(false);
  const [modeOk, setModeOk] = useState('');

  useEffect(() => {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    api.settings
      .get()
      .then((s) => setMode(s.approvalMode))
      .catch(() => setMode('auto'));
  }, [workerUrl, apiKey]);

  async function saveMode(next: ApprovalMode) {
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setModeSaving(true);
    setModeOk('');
    try {
      await api.settings.update({ approvalMode: next });
      setMode(next);
      setModeOk('已保存。新来的广告会按这个模式处理。');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setModeSaving(false);
    }
  }

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
        <h2 className="font-serif text-xl tracking-tight">广告上线策略</h2>
        <p className="mt-2 text-sm text-ink-soft">
          别人挂广告到你的 zone 时走什么流程。改完立刻生效，只影响之后新来的广告。
        </p>
        <div className="mt-5 space-y-2">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                disabled={modeSaving || mode === null}
                onClick={() => void saveMode(m.value)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  active ? 'border-ember bg-ember/10' : 'border-rule hover:border-ink/60 hover:bg-paper-deep/30'
                } ${modeSaving && !active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-3 w-3 rounded-full border ${active ? 'border-ember bg-ember' : 'border-rule'}`}
                  />
                  <span className="font-serif text-lg">{m.label}</span>
                  {m.value === 'ai' && (
                    <span className="rounded-full bg-rule/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                      beta
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">{m.hint}</p>
              </button>
            );
          })}
        </div>
        {modeOk && <p className="mt-4 rounded-md bg-grass/10 px-4 py-3 font-mono text-xs text-grass-deep">{modeOk}</p>}
      </section>

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
