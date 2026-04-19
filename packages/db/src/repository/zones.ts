import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { zones } from '../schema';

export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type ZoneStatus = 'active' | 'paused';

export async function list(db: Db): Promise<Zone[]> {
  return db.select().from(zones).orderBy(desc(zones.createdAt));
}

export async function get(db: Db, id: string): Promise<Zone | undefined> {
  const rows = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  return rows[0];
}

export async function create(db: Db, data: NewZone): Promise<Zone> {
  const [row] = await db.insert(zones).values(data).returning();
  return row;
}

export async function update(db: Db, id: string, patch: Partial<NewZone>): Promise<Zone | undefined> {
  const [row] = await db.update(zones).set(patch).where(eq(zones.id, id)).returning();
  return row;
}

export async function setStatus(db: Db, id: string, status: ZoneStatus): Promise<Zone | undefined> {
  return update(db, id, { status });
}

export async function remove(db: Db, id: string): Promise<void> {
  await db.delete(zones).where(eq(zones.id, id));
}
