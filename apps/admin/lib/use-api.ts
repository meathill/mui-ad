'use client';

import { useMemo } from 'react';
import { apiFromConfig, type Api } from '@/lib/api';
import { DEFAULT_WORKER_URL, useConfig } from '@/lib/store';

/**
 * 组件取 API 客户端的唯一入口：隐藏 workerUrl/apiKey 选择器与历史 null 守卫。
 * makeApi 是纯构造（无副作用），useMemo 按配置缓存即可。
 */
export function useApi(): Api {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  return useMemo(() => apiFromConfig(workerUrl ?? DEFAULT_WORKER_URL, apiKey) as Api, [workerUrl, apiKey]);
}
