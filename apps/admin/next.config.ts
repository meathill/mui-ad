import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
