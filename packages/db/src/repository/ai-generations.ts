import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { aiGenerations } from '../schema';

export type AiGeneration = typeof aiGenerations.$inferSelect;
export type NewAiGeneration = typeof aiGenerations.$inferInsert;

export async function create(db: Db, data: NewAiGeneration): Promise<AiGeneration> {
  const [row] = await db.insert(aiGenerations).values(data).returning();
  return row;
}

export async function get(db: Db, id: number): Promise<AiGeneration | undefined> {
  const rows = await db.select().from(aiGenerations).where(eq(aiGenerations.id, id)).limit(1);
  return rows[0];
}

export interface ListFilter {
  productId?: string;
  adId?: string;
  limit?: number;
  offset?: number;
}

export async function list(db: Db, filter: ListFilter = {}): Promise<AiGeneration[]> {
  const conds = [];
  if (filter.productId) conds.push(eq(aiGenerations.productId, filter.productId));
  if (filter.adId) conds.push(eq(aiGenerations.adId, filter.adId));
  const where = conds.length > 0 ? and(...conds) : undefined;
  const q = db.select().from(aiGenerations);
  return (where ? q.where(where) : q)
    .orderBy(desc(aiGenerations.createdAt))
    .limit(filter.limit ?? 50)
    .offset(filter.offset ?? 0);
}

export async function remove(db: Db, id: number): Promise<void> {
  await db.delete(aiGenerations).where(eq(aiGenerations.id, id));
}
