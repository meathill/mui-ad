import { and, countDistinct, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { ads, zoneAds, zones } from '../schema';
import type { ApprovalMode } from '../schema/user-settings';
import * as userSettings from './user-settings';

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

export type AttachResult = {
  active: string[];
  pending: string[];
  /** 不存在或非 active 状态的 zone，直接跳过 */
  skipped: string[];
};

/**
 * 把广告挂到一组 zone 上。每个 zone 的初始 status 由该 zone 所有者的
 * approval_mode 决定：
 *   - auto        → active
 *   - manual      → pending
 *   - warm        → 如果 zone 已经有 active 的 zone_ads，active；否则 pending
 *   - ai          → Step 2b 才真的调 AI；目前走 manual 兜底
 *   - 若广告主本人就是 zone 所有者 → 一律 active（给自己看）
 *
 * 已存在的 (zone_id, ad_id) 对会被 PRIMARY KEY 约束拒绝，调用方自行决定要不要
 * 先 detach。
 */
export async function attachToZones(
  db: Db,
  adId: string,
  zoneIds: string[],
  opts: { weight?: number; advertiserId: string | null } = { advertiserId: null },
): Promise<AttachResult> {
  const result: AttachResult = { active: [], pending: [], skipped: [] };
  if (zoneIds.length === 0) return result;

  const weight = opts.weight ?? 1;
  const now = new Date();

  // 一次性把所有涉及的 zone 拉出来
  const zoneRows = await db.select().from(zones).where(inArray(zones.id, zoneIds));
  const zoneMap = new Map(zoneRows.map((z) => [z.id, z]));

  // 收集 owner -> mode，缓存，避免重复查
  const modeCache = new Map<string, ApprovalMode>();
  async function modeFor(ownerId: string | null): Promise<ApprovalMode> {
    if (!ownerId) return 'auto'; // 孤儿 zone 兜底自动过
    const cached = modeCache.get(ownerId);
    if (cached) return cached;
    const s = await userSettings.getOrDefault(db, ownerId);
    modeCache.set(ownerId, s.approvalMode);
    return s.approvalMode;
  }

  const toInsert: Array<typeof zoneAds.$inferInsert> = [];
  for (const zid of zoneIds) {
    const z = zoneMap.get(zid);
    if (!z || z.status !== 'active') {
      result.skipped.push(zid);
      continue;
    }

    let status: 'active' | 'pending' = 'active';

    if (opts.advertiserId && z.ownerId === opts.advertiserId) {
      // 自己挂自己 —— 直通
      status = 'active';
    } else {
      const mode = await modeFor(z.ownerId);
      if (mode === 'auto') {
        status = 'active';
      } else if (mode === 'manual' || mode === 'ai') {
        // ai 暂时走 manual，Step 2b 接上真 AI 审核
        status = 'pending';
      } else if (mode === 'warm') {
        const [row] = await db
          .select({ c: countDistinct(zoneAds.adId) })
          .from(zoneAds)
          .where(and(eq(zoneAds.zoneId, zid), eq(zoneAds.status, 'active')));
        status = Number(row?.c ?? 0) > 0 ? 'active' : 'pending';
      }
    }

    toInsert.push({
      zoneId: zid,
      adId,
      weight,
      status,
      advertiserId: opts.advertiserId,
      createdAt: now,
    });
    (status === 'active' ? result.active : result.pending).push(zid);
  }

  if (toInsert.length > 0) {
    await db.insert(zoneAds).values(toInsert);
  }
  return result;
}

/** 审批端：待审的 zone_ads for 一个 zone 所有者。 */
export async function listPendingForOwner(
  db: Db,
  ownerId: string,
): Promise<Array<{ zoneAd: typeof zoneAds.$inferSelect; ad: Ad; zone: typeof zones.$inferSelect }>> {
  const rows = await db
    .select({ zoneAd: zoneAds, ad: ads, zone: zones })
    .from(zoneAds)
    .innerJoin(ads, eq(zoneAds.adId, ads.id))
    .innerJoin(zones, eq(zoneAds.zoneId, zones.id))
    .where(and(eq(zones.ownerId, ownerId), eq(zoneAds.status, 'pending')));
  return rows;
}

/** 批准或驳回。只允许 zone 所有者调。 */
export async function reviewAttachment(
  db: Db,
  args: {
    zoneId: string;
    adId: string;
    ownerId: string;
    decision: 'active' | 'rejected';
    note?: string;
  },
): Promise<boolean> {
  // 先校验这个 zone 确实是 ownerId 的
  const [z] = await db
    .select()
    .from(zones)
    .where(and(eq(zones.id, args.zoneId), eq(zones.ownerId, args.ownerId)))
    .limit(1);
  if (!z) return false;
  const res = await db
    .update(zoneAds)
    .set({
      status: args.decision,
      reviewedAt: new Date(),
      reviewedBy: args.ownerId,
      reviewNote: args.note ?? null,
    })
    .where(and(eq(zoneAds.zoneId, args.zoneId), eq(zoneAds.adId, args.adId)))
    .returning({ adId: zoneAds.adId });
  return res.length > 0;
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
 * Ads eligible to serve on a zone: zone_ad 必须 active 且 ad 自身也 active。
 * /serve 公共路径使用——不按 owner 过滤（zone 发布后谁来访问都行）。
 */
export async function listActiveByZone(db: Db, zoneId: string): Promise<Array<{ ad: Ad; weight: number }>> {
  const rows = await db
    .select({ ad: ads, weight: zoneAds.weight })
    .from(zoneAds)
    .innerJoin(ads, eq(zoneAds.adId, ads.id))
    .where(and(eq(zoneAds.zoneId, zoneId), eq(zoneAds.status, 'active'), eq(ads.status, 'active')));
  return rows;
}

export async function claimOrphans(db: Db, ownerId: string): Promise<number> {
  const rows = await db.update(ads).set({ ownerId }).where(isNull(ads.ownerId)).returning({ id: ads.id });
  return rows.length;
}
