import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Admin has no ISR/SSG content worth caching — keep defaults (in-memory
// cache + DO queue). No R2 incremental cache means deploy doesn't trip the
// OpenNext populate-cache OAuth bug.
export default defineCloudflareConfig({});
