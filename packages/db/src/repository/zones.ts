import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { zones } from '../schema';

export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type ZoneStatus = 'active' | 'paused';

function scope(ownerId: string | undefined) {
  return ownerId === undefined ? undefined : eq(zones.ownerId, ownerId);
}

export async function list(db: Db, ownerId?: string): Promise<Zone[]> {
  const where = scope(ownerId);
  const q = db.select().from(zones);
  return (where ? q.where(where) : q).orderBy(desc(zones.createdAt));
}

export async function get(db: Db, id: string, ownerId?: string): Promise<Zone | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(zones.id, id), where) : eq(zones.id, id);
  const rows = await db.select().from(zones).where(cond).limit(1);
  return rows[0];
}

/**
 * Public-path lookup (用于 /serve、widget embed)：不检查 owner_id。
 * 已发布的 zone 脚本写在外部站点上，widget 调回来时没有用户上下文。
 */
export async function getPublic(db: Db, id: string): Promise<Zone | undefined> {
  const rows = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  return rows[0];
}

export async function create(db: Db, data: NewZone): Promise<Zone> {
  const [row] = await db.insert(zones).values(data).returning();
  return row;
}

export async function update(db: Db, id: string, patch: Partial<NewZone>, ownerId?: string): Promise<Zone | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(zones.id, id), where) : eq(zones.id, id);
  const [row] = await db.update(zones).set(patch).where(cond).returning();
  return row;
}

export async function setStatus(db: Db, id: string, status: ZoneStatus, ownerId?: string): Promise<Zone | undefined> {
  return update(db, id, { status }, ownerId);
}

export async function remove(db: Db, id: string, ownerId?: string): Promise<void> {
  const where = scope(ownerId);
  const cond = where ? and(eq(zones.id, id), where) : eq(zones.id, id);
  await db.delete(zones).where(cond);
}

export async function claimOrphans(db: Db, ownerId: string): Promise<number> {
  const rows = await db.update(zones).set({ ownerId }).where(isNull(zones.ownerId)).returning({ id: zones.id });
  return rows.length;
}
