import { eq } from 'drizzle-orm';
import type { Db } from '../db';
import { userSettings } from '../schema';
import type { ApprovalMode } from '../schema/user-settings';

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type { ApprovalMode };

/** 没存就返回默认值（auto），不会写库 */
export async function getOrDefault(db: Db, userId: string): Promise<{ userId: string; approvalMode: ApprovalMode }> {
  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  const row = rows[0];
  return {
    userId,
    approvalMode: (row?.approvalMode as ApprovalMode | undefined) ?? 'auto',
  };
}

/** upsert —— 不存在就 insert，存在就 update */
export async function upsert(db: Db, userId: string, patch: { approvalMode: ApprovalMode }): Promise<UserSettings> {
  const now = new Date();
  const [existing] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (existing) {
    const [row] = await db
      .update(userSettings)
      .set({ approvalMode: patch.approvalMode, updatedAt: now })
      .where(eq(userSettings.userId, userId))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(userSettings)
    .values({ userId, approvalMode: patch.approvalMode, createdAt: now, updatedAt: now })
    .returning();
  return row;
}
