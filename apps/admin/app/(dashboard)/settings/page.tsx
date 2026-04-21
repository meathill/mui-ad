'use client';

import { ArrowSquareOut, Key } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { PROVIDER_LIST } from '@/lib/providers';
import { useConfig } from '@/lib/store';

export default function SettingsPage() {
  const workerUrl = useConfig((s) => s.workerUrl);
  const openaiKey = useConfig((s) => s.openaiKey);
  const googleKey = useConfig((s) => s.googleKey);
  const setProviderKey = useConfig((s) => s.setProviderKey);

  const [oaiInput, setOaiInput] = useState('');
  const [gglInput, setGglInput] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setOaiInput(openaiKey ?? '');
    setGglInput(googleKey ?? '');
  }, [openaiKey, googleKey]);

  function saveKey(provider: 'openai' | 'google', value: string) {
    setProviderKey(provider, value.trim() || null);
    setMessage(`${provider} key 已${value ? '保存' : '清除'}（localStorage，不上传）`);
    setTimeout(() => setMessage(''), 2400);
  }

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">settings</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">设置</h1>
      <p className="mt-3 text-ink-soft">
        节点连接信息和生图 provider 的 API key 都存在浏览器 localStorage 里，不会上传到
        worker。换浏览器或清缓存需要重新填。
      </p>

      <section className="mt-12">
        <SectionHead label="节点" title="当前连接的 worker" />
        <div className="rounded-xl border border-rule/60 bg-paper-deep/30 p-5">
          <div className="font-mono text-[13px]">{workerUrl ?? '—'}</div>
          <div className="mt-1 font-mono text-[11px] text-ink-soft">要改 worker URL / MUIAD_API_KEY 去 /setup</div>
        </div>
      </section>

      <section className="mt-12">
        <SectionHead label="byok · image providers" title="生图 provider API key" />
        <p className="mb-6 text-sm text-ink-soft">
          填入你自己的 API key；这台 admin 在你的浏览器里直接用它调 provider SDK。 MuiAD 节点不会看到也不会存储这些
          key。
        </p>
        <div className="space-y-6">
          {PROVIDER_LIST.map((p) => {
            const current = p.id === 'openai' ? oaiInput : gglInput;
            const setCurrent = p.id === 'openai' ? setOaiInput : setGglInput;
            const configured = p.id === 'openai' ? Boolean(openaiKey) : Boolean(googleKey);
            return (
              <div key={p.id} className="rounded-xl border border-rule/60 bg-paper p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif text-xl">{p.label}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-soft">
                      {p.models.map((m) => m.id).join(' · ')}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
                      configured ? 'bg-grass/15 text-grass-deep' : 'bg-rule/60 text-ink-soft'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${configured ? 'bg-grass' : 'bg-ink-soft/40'}`} />
                    {configured ? 'configured' : 'not set'}
                  </span>
                </div>

                <Field label="API key">
                  <input
                    type="password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder={p.id === 'openai' ? 'sk-...' : 'AIza...'}
                    className={inputMonoClass}
                  />
                </Field>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveKey(p.id, current)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ember-deep"
                  >
                    <Key size={12} /> 保存
                  </button>
                  {configured && (
                    <button
                      type="button"
                      onClick={() => saveKey(p.id, '')}
                      className="rounded-full border border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft hover:border-danger-deep hover:text-danger-deep"
                    >
                      清除
                    </button>
                  )}
                  <a
                    href={p.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-deep hover:underline"
                  >
                    去拿 key <ArrowSquareOut size={10} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        {message && (
          <p className="mt-4 rounded-md bg-grass/10 px-4 py-2 font-mono text-xs text-grass-deep">{message}</p>
        )}
      </section>
    </div>
  );
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</p>
      <h2 className="mt-1.5 font-serif text-2xl tracking-tight">{title}</h2>
    </div>
  );
}
