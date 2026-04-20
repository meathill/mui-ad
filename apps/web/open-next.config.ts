import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Landing page has no meaningful ISR/SSG caching —— everything is static
// pages + a single waitlist POST + OG/favicon dynamic routes. Skipping
// r2IncrementalCache also dodges the `opennextjs-cloudflare deploy`
// populate-cache OAuth bug that blocks CF Workers Builds (DEV_NOTE.md).
export default defineCloudflareConfig({});
