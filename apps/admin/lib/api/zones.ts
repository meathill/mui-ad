import type { Zone } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createZones(r: RequestFn): Api['zones'] {
  return {
    list: async () => (await r<{ zones: Zone[] }>('/api/zones')).zones,
    get: (id) => r<{ zone: Zone; embedCode: string }>(`/api/zones/${id}`),
    create: (data) =>
      r<{ zone: Zone; embedCode: string }>('/api/zones', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id, patch) =>
      (
        await r<{ zone: Zone }>(`/api/zones/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      ).zone,
    setStatus: async (id, status) =>
      (
        await r<{ zone: Zone }>(`/api/zones/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
      ).zone,
    remove: (id) => r<void>(`/api/zones/${id}`, { method: 'DELETE' }),
  };
}
