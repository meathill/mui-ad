import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono, Geist } from 'next/font/google';
import Link from 'next/link';
import { GithubLogo } from '@phosphor-icons/react/dist/ssr';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const body = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MuiAD — 写完代码，让 AI 顺手帮你推广',
  description:
    '自托管、MCP-first 的开发者推广网络。你的 AI Coding Agent 通过 MCP 直接创建广告位、投放产品、记录转化——不用登广告后台，不用付广告费。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <header className="border-b border-rule/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-serif text-2xl tracking-tight">MuiAD</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">v0 · beta</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <a
                href="https://github.com/meathill/mui-ad"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
              >
                <GithubLogo size={16} weight="bold" />
                <span>GitHub</span>
              </a>
              <Link
                href="#waitlist"
                className="rounded-full bg-ink px-4 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ember-deep"
              >
                加入 Waitlist
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-rule/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-ink-soft md:flex-row md:items-baseline md:justify-between">
            <p className="font-serif text-base italic">MuiAD — decentralized, AI-driven dev marketing.</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">built on Cloudflare · MCP-first</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
