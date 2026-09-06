import type { ApiKeyPublic } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createApiKeys(r: RequestFn): Api['apiKeys'] {
  return {
    list: async () => (await r<{ keys: ApiKeyPublic[] }>('/api/api-keys')).keys,
    create: (name) =>
      r<{ key: ApiKeyPublic; raw: string }>('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    revoke: (id) => r<void>(`/api/api-keys/${id}`, { method: 'DELETE' }),
  };
}
