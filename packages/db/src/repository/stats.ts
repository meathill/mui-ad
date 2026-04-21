import { count, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { clicks, impressions } from '../schema';

export type ZoneStats = {
  impressions: number;
  clicks: number;
  ctr: number;
};

export async function zoneStats(db: Db, zoneId: string): Promise<ZoneStats> {
  const [imp] = await db.select({ total: count() }).from(impressions).where(eq(impressions.zoneId, zoneId));
  const [clk] = await db.select({ total: count() }).from(clicks).where(eq(clicks.zoneId, zoneId));

  const impressionCount = imp?.total ?? 0;
  const clickCount = clk?.total ?? 0;
  const ctr = impressionCount > 0 ? clickCount / impressionCount : 0;

  return { impressions: impressionCount, clicks: clickCount, ctr };
}

export async function recordImpression(
  db: Db,
  data: {
    zoneId: string;
    adId: string;
    ipHash: string;
    userAgent?: string;
    referer?: string;
    createdAt: string;
  },
): Promise<void> {
  await db.insert(impressions).values(data);
}

export async function recordClick(
  db: Db,
  data: {
    zoneId: string;
    adId: string;
    ipHash: string;
    userAgent?: string;
    referer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    createdAt: string;
  },
): Promise<void> {
  await db.insert(clicks).values(data);
}
