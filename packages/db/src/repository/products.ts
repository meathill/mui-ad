import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { products } from '../schema';

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export async function list(db: Db): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function get(db: Db, id: string): Promise<Product | undefined> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

export async function create(db: Db, data: NewProduct): Promise<Product> {
  const [row] = await db.insert(products).values(data).returning();
  return row;
}

export async function update(db: Db, id: string, patch: Partial<NewProduct>): Promise<Product | undefined> {
  const [row] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
  return row;
}

export async function remove(db: Db, id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}
