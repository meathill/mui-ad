import type { Ad, Zone } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createApprovals(r: RequestFn): Api['approvals'] {
  return {
    list: async () =>
      (
        await r<{
          pending: Array<{
            zoneAd: {
              zoneId: string;
              adId: string;
              advertiserId: string | null;
              createdAt: number | null;
              reviewNote: string | null;
            };
            ad: Ad;
            zone: Zone;
          }>;
        }>('/api/approvals')
      ).pending,
    approve: (zoneId, adId, note) =>
      r<void>('/api/approvals/approve', { method: 'POST', body: JSON.stringify({ zoneId, adId, note }) }),
    reject: (zoneId, adId, note) =>
      r<void>('/api/approvals/reject', { method: 'POST', body: JSON.stringify({ zoneId, adId, note }) }),
  };
}
