'use client';

import { ChartBar, Gear, Megaphone, Package, Sparkle, SlidersHorizontal, Stack } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConfig } from '@/lib/store';

const NAV = [
  { href: '/', label: '概览', icon: ChartBar },
  { href: '/zones', label: '广告位', icon: Stack },
  { href: '/products', label: '产品', icon: Package },
  { href: '/ads', label: '广告', icon: Megaphone },
  { href: '/ai-generations', label: 'AI 历史', icon: Sparkle },
  { href: '/settings', label: '设置', icon: SlidersHorizontal },
];

export default function Sidebar() {
  const pathname = usePathname();
  const workerUrl = useConfig((s) => s.workerUrl);
  const clear = useConfig((s) => s.clear);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-rule/60 bg-paper-deep/40 px-5 py-7">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="font-serif text-2xl tracking-tight">MuiAD</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">admin</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-0.5 text-sm">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${
                active ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-rule/40 hover:text-ink'
              }`}
            >
              <Icon size={16} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6 text-xs text-ink-soft">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Gear size={12} />
          <span>连接到</span>
        </div>
        <div className="truncate font-mono text-[11px] text-ink" title={workerUrl ?? ''}>
          {workerUrl?.replace(/^https?:\/\//, '') ?? '—'}
        </div>
        <button
          type="button"
          onClick={() => clear()}
          className="mt-1 self-start font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 hover:text-ember-deep hover:underline"
        >
          重新配置
        </button>
      </div>
    </aside>
  );
}
