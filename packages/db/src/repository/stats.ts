import { and, count, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { clicks, conversions, impressions } from '../schema';

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
): Promise<{ id: number }> {
  const [row] = await db.insert(clicks).values(data).returning({ id: clicks.id });
  return row;
}

export type NewConversion = {
  adId: string;
  zoneId?: string;
  clickId?: number;
  eventType: string;
  value?: number;
  currency?: string;
  ipHash?: string;
  referer?: string;
  meta?: string;
  createdAt: string;
};

export async function recordConversion(db: Db, data: NewConversion): Promise<void> {
  await db.insert(conversions).values(data);
}

export type ConversionsSummary = {
  total: number;
  byEventType: Array<{ eventType: string; count: number; totalValue: number }>;
};

/** Aggregate conversions for a given ad: total count + per-event-type count & value sum. */
export async function conversionsForAd(db: Db, adId: string): Promise<ConversionsSummary> {
  const rows = await db
    .select({
      eventType: conversions.eventType,
      count: count(),
      totalValue: sql<number>`COALESCE(SUM(${conversions.value}), 0)`.as('total_value'),
    })
    .from(conversions)
    .where(eq(conversions.adId, adId))
    .groupBy(conversions.eventType);
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return {
    total,
    byEventType: rows.map((r) => ({
      eventType: r.eventType,
      count: Number(r.count),
      totalValue: Number(r.totalValue ?? 0),
    })),
  };
}

/** Look up the ad + zone for a given click (so /track/conversion can infer zone_id). */
export async function clickContext(db: Db, clickId: number): Promise<{ adId: string; zoneId: string } | undefined> {
  const [row] = await db
    .select({ adId: clicks.adId, zoneId: clicks.zoneId })
    .from(clicks)
    .where(eq(clicks.id, clickId))
    .limit(1);
  return row;
}
