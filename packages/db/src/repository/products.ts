import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { products } from '../schema';

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

/**
 * ownerId 语义：
 * - `string` → 按此 user 过滤（普通用户）
 * - `undefined` → 不过滤（root key / MCP / CI，跨用户可见）
 */
function scope(ownerId: string | undefined) {
  return ownerId === undefined ? undefined : eq(products.ownerId, ownerId);
}

export async function list(db: Db, ownerId?: string): Promise<Product[]> {
  const where = scope(ownerId);
  const q = db.select().from(products);
  return (where ? q.where(where) : q).orderBy(desc(products.createdAt));
}

export async function get(db: Db, id: string, ownerId?: string): Promise<Product | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(products.id, id), where) : eq(products.id, id);
  const rows = await db.select().from(products).where(cond).limit(1);
  return rows[0];
}

export async function create(db: Db, data: NewProduct): Promise<Product> {
  const [row] = await db.insert(products).values(data).returning();
  return row;
}

export async function update(
  db: Db,
  id: string,
  patch: Partial<NewProduct>,
  ownerId?: string,
): Promise<Product | undefined> {
  const where = scope(ownerId);
  const cond = where ? and(eq(products.id, id), where) : eq(products.id, id);
  const [row] = await db.update(products).set(patch).where(cond).returning();
  return row;
}

export async function remove(db: Db, id: string, ownerId?: string): Promise<void> {
  const where = scope(ownerId);
  const cond = where ? and(eq(products.id, id), where) : eq(products.id, id);
  await db.delete(products).where(cond);
}

/** Admin-only: 把所有 owner_id IS NULL 的行赋给指定 user。 */
export async function claimOrphans(db: Db, ownerId: string): Promise<number> {
  const rows = await db
    .update(products)
    .set({ ownerId })
    .where(isNull(products.ownerId))
    .returning({ id: products.id });
  return rows.length;
}
