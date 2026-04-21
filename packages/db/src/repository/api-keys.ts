import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { apiKeys } from '../schema';

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type ApiKeyPublic = Omit<ApiKey, 'hash'>;

/** 给用户看的 —— 不暴露 hash */
function stripHash(row: ApiKey): ApiKeyPublic {
  const { hash: _h, ...rest } = row;
  return rest;
}

export async function listForUser(db: Db, userId: string): Promise<ApiKeyPublic[]> {
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  return rows.map(stripHash);
}

export async function create(db: Db, data: NewApiKey): Promise<ApiKeyPublic> {
  const [row] = await db.insert(apiKeys).values(data).returning();
  return stripHash(row);
}

/** 仅用于中间件：通过 hash 找 key + user。只返回未撤销的。 */
export async function findActiveByHash(db: Db, hash: string): Promise<ApiKey | undefined> {
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.hash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);
  return rows[0];
}

export async function touch(db: Db, id: string): Promise<void> {
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

export async function revoke(db: Db, id: string, userId: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}
