import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { ads, zoneAds } from '../schema';

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
export type AdStatus = 'active' | 'paused';
export type ZoneAd = typeof zoneAds.$inferSelect;

function scope(ownerId: string | undefined) {
  return ownerId === undefined ? undefined : eq(ads.ownerId, ownerId);
}

export async function list(db: Db, ownerId?: string): Promise<Ad[]> {
  const where = scope(ownerId);
  const q = db.select().from(ads);
  return (where ? q.where(where) : q).orderBy(desc(ads.createdAt));
}

export async function get(db: Db, id: string, ownerId?: string): Promise<Ad | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(ads.id, id), where) : eq(ads.id, id);
  const rows = await db.select().from(ads).where(cond).limit(1);
  return rows[0];
}

export async function create(db: Db, data: NewAd): Promise<Ad> {
  const [row] = await db.insert(ads).values(data).returning();
  return row;
}

export async function update(db: Db, id: string, patch: Partial<NewAd>, ownerId?: string): Promise<Ad | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(ads.id, id), where) : eq(ads.id, id);
  const [row] = await db.update(ads).set(patch).where(cond).returning();
  return row;
}

export async function setStatus(db: Db, id: string, status: AdStatus, ownerId?: string): Promise<Ad | undefined> {
  return update(db, id, { status }, ownerId);
}

export async function remove(db: Db, id: string, ownerId?: string): Promise<void> {
  // 先确认归属，避免误删别人的 ad（以及 zone_ads 关联）
  const existing = await get(db, id, ownerId);
  if (!existing) return;
  await db.delete(zoneAds).where(eq(zoneAds.adId, id));
  await db.delete(ads).where(eq(ads.id, id));
}

/**
 * Attach an ad to one or more zones. Safe to call repeatedly — duplicate
 * (zoneId, adId) pairs are rejected by the primary-key constraint.
 */
export async function attachToZones(db: Db, adId: string, zoneIds: string[], weight = 1): Promise<void> {
  if (zoneIds.length === 0) return;
  const rows = zoneIds.map((zoneId) => ({ zoneId, adId, weight }));
  await db.insert(zoneAds).values(rows);
}

export async function detachFromZones(db: Db, adId: string, zoneIds: string[]): Promise<void> {
  if (zoneIds.length === 0) return;
  await db.delete(zoneAds).where(and(eq(zoneAds.adId, adId), inArray(zoneAds.zoneId, zoneIds)));
}

/** All zones an ad is currently attached to, with join weights. Used by admin edit UI. */
export async function listZonesOf(db: Db, adId: string): Promise<Array<{ zoneId: string; weight: number }>> {
  return db.select({ zoneId: zoneAds.zoneId, weight: zoneAds.weight }).from(zoneAds).where(eq(zoneAds.adId, adId));
}

/**
 * Ads eligible to serve on a zone: active ads attached to it, with join weight.
 * 这是 /serve 公共路径使用的——不按 owner 过滤（zone 发布后谁来访问都行）。
 */
export async function listActiveByZone(db: Db, zoneId: string): Promise<Array<{ ad: Ad; weight: number }>> {
  const rows = await db
    .select({ ad: ads, weight: zoneAds.weight })
    .from(zoneAds)
    .innerJoin(ads, eq(zoneAds.adId, ads.id))
    .where(and(eq(zoneAds.zoneId, zoneId), eq(ads.status, 'active')));
  return rows;
}

export async function claimOrphans(db: Db, ownerId: string): Promise<number> {
  const rows = await db.update(ads).set({ ownerId }).where(isNull(ads.ownerId)).returning({ id: ads.id });
  return rows.length;
}
