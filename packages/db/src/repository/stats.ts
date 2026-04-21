import { and, count, countDistinct, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { clicks, conversions, impressions } from '../schema';

export type ZoneStats = {
  /** 总展示量（不去重） */
  impressions: number;
  /** 总点击量（不去重） */
  clicks: number;
  ctr: number;
  /** 独立访客（distinct session_id）；历史 NULL session 不计入 */
  uniqueViewers: number;
  /** 独立点击者 */
  uniqueClickers: number;
};

export async function zoneStats(db: Db, zoneId: string): Promise<ZoneStats> {
  const [imp] = await db
    .select({
      total: count(),
      unique: countDistinct(impressions.sessionId),
    })
    .from(impressions)
    .where(eq(impressions.zoneId, zoneId));
  const [clk] = await db
    .select({
      total: count(),
      unique: countDistinct(clicks.sessionId),
    })
    .from(clicks)
    .where(eq(clicks.zoneId, zoneId));

  const impressionCount = imp?.total ?? 0;
  const clickCount = clk?.total ?? 0;
  const ctr = impressionCount > 0 ? clickCount / impressionCount : 0;

  return {
    impressions: impressionCount,
    clicks: clickCount,
    ctr,
    uniqueViewers: imp?.unique ?? 0,
    uniqueClickers: clk?.unique ?? 0,
  };
}

export async function recordImpression(
  db: Db,
  data: {
    zoneId: string;
    adId: string;
    ipHash: string;
    userAgent?: string;
    referer?: string;
    sessionId?: string;
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
    sessionId?: string;
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
  sessionId?: string;
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

export type UtmSourceRow = { source: string | null; count: number };
export type RefererRow = { referer: string | null; count: number };
export type ConversionByAdRow = {
  adId: string;
  count: number;
  totalValue: number;
};

/** Clicks on a zone grouped by utm_source. Null source = direct / untagged. */
export async function utmSourcesForZone(db: Db, zoneId: string): Promise<UtmSourceRow[]> {
  const rows = await db
    .select({ source: clicks.utmSource, count: count() })
    .from(clicks)
    .where(eq(clicks.zoneId, zoneId))
    .groupBy(clicks.utmSource);
  return rows.map((r) => ({ source: r.source, count: Number(r.count) }));
}

/** Top `limit` referers (host-page URLs) of clicks on a zone. */
export async function topReferersForZone(db: Db, zoneId: string, limit = 10): Promise<RefererRow[]> {
  const rows = await db
    .select({ referer: clicks.referer, count: count() })
    .from(clicks)
    .where(eq(clicks.zoneId, zoneId))
    .groupBy(clicks.referer)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
  return rows.map((r) => ({ referer: r.referer, count: Number(r.count) }));
}

/** Conversions grouped by ad for a given zone. */
export async function conversionsByAdInZone(db: Db, zoneId: string): Promise<ConversionByAdRow[]> {
  const rows = await db
    .select({
      adId: conversions.adId,
      count: count(),
      totalValue: sql<number>`COALESCE(SUM(${conversions.value}), 0)`.as('total_value'),
    })
    .from(conversions)
    .where(eq(conversions.zoneId, zoneId))
    .groupBy(conversions.adId);
  return rows.map((r) => ({
    adId: r.adId,
    count: Number(r.count),
    totalValue: Number(r.totalValue ?? 0),
  }));
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
