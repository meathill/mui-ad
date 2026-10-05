import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://muiad.meathill.com';

/**
 * HTML-only sitemap (same rule as hsm#3).
 * This marketing site currently has a single public HTML page; agent-discovery
 * assets (llms.txt, llms-full.txt, mcp.json, favicon) stay out of the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
