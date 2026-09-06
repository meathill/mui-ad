import type { ConversionByAdRow, ConversionsSummary, RefererRow, UtmSourceRow, ZoneStats } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createStats(r: RequestFn): Api['stats'] {
  return {
    zone: (zoneId) => r<ZoneStats & { zoneId: string }>(`/api/stats/zones/${zoneId}`),
    zoneBreakdown: (zoneId) =>
      r<{
        zoneId: string;
        totals: ZoneStats;
        utmSources: UtmSourceRow[];
        referers: RefererRow[];
        conversions: ConversionByAdRow[];
      }>(`/api/stats/zones/${zoneId}/breakdown`),
    adConversions: (adId) => r<ConversionsSummary & { adId: string }>(`/api/stats/ads/${adId}/conversions`),
  };
}
