'use client';

export function ErrorBanner({ message, className = '' }: { message: string; className?: string }) {
  if (!message) return null;
  return (
    <p
      className={`${className ? `${className} ` : ''}rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep`}
    >
      {message}
    </p>
  );
}

export function Loading({ text = '加载中…', className = '' }: { text?: string; className?: string }) {
  return (
    <div
      className={`${className ? `${className} ` : ''}text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-soft`}
    >
      {text}
    </div>
  );
}
