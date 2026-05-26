import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { user } from '../schema';

export type User = typeof user.$inferSelect;

/** 给 admin / operator 看的用户视图（user 表本身不含密码）。 */
export type AdminUserView = {
  id: string;
  email: string;
  name: string;
  role: string | null;
  createdAt: Date;
};

export async function list(db: Db): Promise<AdminUserView[]> {
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export async function remove(db: Db, id: string): Promise<void> {
  // session / account 通过外键 onDelete: cascade 自动清理。
  await db.delete(user).where(eq(user.id, id));
}
