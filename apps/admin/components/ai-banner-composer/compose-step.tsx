'use client';

import { ArrowRight } from '@phosphor-icons/react';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import type { BannerComposer } from './use-banner-composer';

export function ComposeStep({ c }: { c: BannerComposer }) {
  const generating = c.step === 'generating';
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Provider">
          <select
            value={c.providerId}
            onChange={(e) => c.selectProvider(e.target.value as typeof c.providerId)}
            className={inputClass}
          >
            {c.availableProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model">
          <select value={c.modelId} onChange={(e) => c.setModelId(e.target.value)} className={inputClass}>
            {c.provider?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Prompt">
        <textarea
          rows={6}
          value={c.prompt}
          onChange={(e) => c.setPrompt(e.target.value)}
          className={`${inputClass} font-mono text-[13px] leading-relaxed`}
        />
      </Field>

      <Field label="输出尺寸" hint="OpenAI 固定 1024x1024 / 1024x1536 / 1536x1024；Gemini 默认 1024x1024">
        <select value={c.size} onChange={(e) => c.setSize(e.target.value)} className={inputMonoClass}>
          {(c.model?.sizes ?? ['1024x1024']).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      {c.error && <p className="rounded-md bg-danger/10 px-4 py-2 font-mono text-xs text-danger-deep">{c.error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={c.handleGenerate}
          disabled={generating || !c.prompt.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
        >
          {generating ? '生成中…（10–60 秒）' : '生成'}
          {!generating && <ArrowRight size={12} weight="bold" />}
        </button>
      </div>
    </div>
  );
}
