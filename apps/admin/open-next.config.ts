import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Admin has no ISR/SSG content worth caching — keep defaults (in-memory
// cache + DO queue). No R2 incremental cache means deploy doesn't trip the
// OpenNext populate-cache OAuth bug.
//
// enableCacheInterception pinned off: see apps/web/open-next.config.ts
// (opennextjs-cloudflare#1348, unfixed as of 1.20.6).
export default defineCloudflareConfig({
  enableCacheInterception: false,
});
