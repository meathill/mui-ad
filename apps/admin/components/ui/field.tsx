import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20';

export const inputMonoClass = `${inputClass} font-mono`;
