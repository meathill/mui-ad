import type { RequestFn } from './client';
import type { Api } from './types';

export function createSettings(r: RequestFn): Api['settings'] {
  return {
    get: async () =>
      (await r<{ settings: { userId: string; approvalMode: 'auto' | 'manual' | 'warm' | 'ai' } }>('/api/settings'))
        .settings,
    update: (patch) => r<unknown>('/api/settings', { method: 'PATCH', body: JSON.stringify(patch) }),
  };
}
