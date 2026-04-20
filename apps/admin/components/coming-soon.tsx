import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export default function ComingSoon({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">{label}</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-6 max-w-xl text-ink-soft">{hint}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ember-deep hover:underline"
      >
        回到概览 <ArrowRight size={12} weight="bold" />
      </Link>
    </div>
  );
}
