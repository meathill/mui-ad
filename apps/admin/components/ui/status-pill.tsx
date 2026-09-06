'use client';

export function StatusPill({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
        isActive ? 'bg-grass/15 text-grass-deep' : 'bg-rule/60 text-ink-soft'
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-grass' : 'bg-ink-soft/40'}`} />
      {status}
    </span>
  );
}
