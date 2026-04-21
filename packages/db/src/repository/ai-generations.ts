import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { aiGenerations } from '../schema';

export type AiGeneration = typeof aiGenerations.$inferSelect;
export type NewAiGeneration = typeof aiGenerations.$inferInsert;

export async function create(db: Db, data: NewAiGeneration): Promise<AiGeneration> {
  const [row] = await db.insert(aiGenerations).values(data).returning();
  return row;
}

export async function get(db: Db, id: number, ownerId?: string): Promise<AiGeneration | undefined> {
  const conds = [eq(aiGenerations.id, id)];
  if (ownerId !== undefined) conds.push(eq(aiGenerations.ownerId, ownerId));
  const rows = await db
    .select()
    .from(aiGenerations)
    .where(conds.length > 1 ? and(...conds) : conds[0])
    .limit(1);
  return rows[0];
}

export interface ListFilter {
  productId?: string;
  adId?: string;
  limit?: number;
  offset?: number;
  ownerId?: string;
}

export async function list(db: Db, filter: ListFilter = {}): Promise<AiGeneration[]> {
  const conds = [];
  if (filter.productId) conds.push(eq(aiGenerations.productId, filter.productId));
  if (filter.adId) conds.push(eq(aiGenerations.adId, filter.adId));
  if (filter.ownerId !== undefined) conds.push(eq(aiGenerations.ownerId, filter.ownerId));
  const where = conds.length > 0 ? and(...conds) : undefined;
  const q = db.select().from(aiGenerations);
  return (where ? q.where(where) : q)
    .orderBy(desc(aiGenerations.createdAt))
    .limit(filter.limit ?? 50)
    .offset(filter.offset ?? 0);
}

export async function remove(db: Db, id: number, ownerId?: string): Promise<void> {
  const conds = [eq(aiGenerations.id, id)];
  if (ownerId !== undefined) conds.push(eq(aiGenerations.ownerId, ownerId));
  await db.delete(aiGenerations).where(conds.length > 1 ? and(...conds) : conds[0]);
}

export async function claimOrphans(db: Db, ownerId: string): Promise<number> {
  const rows = await db
    .update(aiGenerations)
    .set({ ownerId })
    .where(isNull(aiGenerations.ownerId))
    .returning({ id: aiGenerations.id });
  return rows.length;
}
