import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Landing page has no meaningful ISR/SSG caching —— everything is static
// pages + a single waitlist POST + OG/favicon dynamic routes. Skipping
// r2IncrementalCache also dodges the `opennextjs-cloudflare deploy`
// populate-cache OAuth bug that blocks CF Workers Builds (DEV_NOTE.md).
//
// Cache interception is pinned off on purpose: it is already the upstream
// default, but the Next 16.3 endless `_rsc` prefetch loop (opennextjs-cloudflare#1348)
// remains unfixed as of 1.20.6, so lock in the safe value in case the default flips.
export default defineCloudflareConfig({
  enableCacheInterception: false,
});
