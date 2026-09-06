import type { Ad } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createAds(r: RequestFn): Api['ads'] {
  return {
    list: async () => (await r<{ ads: Ad[] }>('/api/ads')).ads,
    get: async (id) => (await r<{ ad: Ad }>(`/api/ads/${id}`)).ad,
    listZones: async (id) =>
      (await r<{ zones: Array<{ zoneId: string; weight: number }> }>(`/api/ads/${id}/zones`)).zones,
    create: async (data) => (await r<{ ad: Ad }>('/api/ads', { method: 'POST', body: JSON.stringify(data) })).ad,
    update: async (id, patch) =>
      (
        await r<{ ad: Ad }>(`/api/ads/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      ).ad,
    setStatus: async (id, status) =>
      (
        await r<{ ad: Ad }>(`/api/ads/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
      ).ad,
    remove: (id) => r<void>(`/api/ads/${id}`, { method: 'DELETE' }),
    attach: (id, zoneIds, weight) =>
      r<void>(`/api/ads/${id}/zones`, {
        method: 'POST',
        body: JSON.stringify({ zoneIds, weight }),
      }),
    detach: (id, zoneIds) =>
      r<void>(`/api/ads/${id}/zones`, {
        method: 'DELETE',
        body: JSON.stringify({ zoneIds }),
      }),
  };
}
