import { brandCatalog, getOrganizationJsonLd } from 'meathill-brand';
import { BrandFooter, BrandHeader } from 'meathill-brand-react';
import { GithubLogo } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://muiad.meathill.com';
const TITLE = 'MuiAD — Self-hosted ad network for the MCP era';
const DESCRIPTION =
  'Self-hosted、MCP-first 的开发者推广网络。你的 AI Coding Agent 通过 MCP 创建广告位、生成物料、自动审核、自动优化——全部跑在你自己的 Cloudflare 账号里。一行代码不写，一分广告费不付。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · MuiAD',
  },
  description: DESCRIPTION,
  applicationName: 'MuiAD',
  keywords: [
    'MCP',
    'Model Context Protocol',
    'AI marketing',
    'developer marketing',
    'self-hosted',
    'self-hosted ad network',
    'cross-node marketplace',
    'Workers AI moderation',
    'decentralized advertising',
    'Cloudflare Workers',
    'indie hacker',
    'side project promotion',
    '开发者推广',
    '独立开发',
  ],
  authors: [{ name: 'Meathill', url: 'https://meathill.com' }],
  creator: 'Meathill',
  publisher: 'Meathill Studio',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    url: SITE_URL,
    siteName: 'MuiAD',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: TITLE }],
    creator: '@meathill',
    site: '@meathill',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationJsonLd(),
    {
      '@type': 'WebSite',
      name: 'MuiAD',
      description: DESCRIPTION,
      url: SITE_URL,
      inLanguage: ['zh-CN', 'en-US'],
      sameAs: ['https://github.com/meathill/mui-ad'],
      publisher: { '@id': brandCatalog.organization.id },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD metadata
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BrandHeader
          currentSiteId="muiad"
          locale="zh"
          productName="MuiAD"
          productUrl={SITE_URL}
          actions={
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
                prefetch={false}
                href="#waitlist"
                className="rounded-full bg-ink px-4 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ember-deep"
              >
                加入 Waitlist
              </Link>
            </nav>
          }
        />

        <main>{children}</main>

        <BrandFooter
          className="mt-24"
          currentSiteId="muiad"
          description="MuiAD — decentralized, AI-driven dev marketing."
          locale="zh"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-[12px] uppercase tracking-[0.18em]">
            <span>built on Cloudflare · MCP-first</span>
            <a
              href="https://firstlook.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              Featured on First Look
            </a>
          </div>
        </BrandFooter>
      </body>
    </html>
  );
}
