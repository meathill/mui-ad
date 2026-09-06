'use client';

import { DEFAULT_WORKER_URL } from '@/lib/store';
import { createRequest } from './client';
import { createAds } from './ads';
import { createAdmin } from './admin';
import { createAiGenerations } from './ai-generations';
import { createApiKeys } from './api-keys';
import { createApprovals } from './approvals';
import { createProducts } from './products';
import { createSettings } from './settings';
import { createStats } from './stats';
import { createUploads } from './uploads';
import { createZones } from './zones';
import type { Api } from './types';

export function makeApi(workerUrl: string, apiKey: string | null): Api {
  const r = createRequest(workerUrl, apiKey);
  return {
    products: createProducts(r),
    zones: createZones(r),
    ads: createAds(r),
    stats: createStats(r),
    uploads: createUploads(r),
    aiGenerations: createAiGenerations(r),
    admin: createAdmin(r),
    apiKeys: createApiKeys(r),
    settings: createSettings(r),
    approvals: createApprovals(r),
  };
}

/**
 * 给组件用的便捷构造：workerUrl 缺省回退默认节点，apiKey 可空（纯靠 cookie 鉴权）。
 * 返回类型保留 `| null` 仅为兼容历史调用处的 `if (!api) return` 守卫，实际恒返回 Api。
 */
export function apiFromConfig(workerUrl: string | null, apiKey: string | null): Api | null {
  return makeApi(workerUrl ?? DEFAULT_WORKER_URL, apiKey);
}

export { ApiError, authHeaders, createRequest, type RequestFn } from './client';
export type { AdminUserDto, Api } from './types';
