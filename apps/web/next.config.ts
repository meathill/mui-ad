import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
