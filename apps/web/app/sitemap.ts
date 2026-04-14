import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://muiad.dev',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'https://muiad.dev/features',
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: 'https://muiad.dev/docs',
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: 'https://muiad.dev/deploy',
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}
