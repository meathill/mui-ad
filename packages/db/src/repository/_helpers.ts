import { eq, isNull } from 'drizzle-orm';
import type { AnySQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Db } from '../db';

/**
 * ownerId 语义：
 * - `string` → 按此 user 过滤（普通用户）
 * - `undefined` → 不过滤（root key / MCP / CI，跨用户可见）
 */
export function ownerScope(ownerId: string | undefined, column: AnySQLiteColumn) {
  return ownerId === undefined ? undefined : eq(column, ownerId);
}

type OwnableTable = SQLiteTable & { ownerId: AnySQLiteColumn; id: AnySQLiteColumn };

/** 把所有 owner_id IS NULL 的行赋给指定 user（admin 认领孤儿数据用）。返回认领行数。 */
export async function claimOrphansFor(db: Db, table: OwnableTable, ownerId: string): Promise<number> {
  const rows = await db.update(table).set({ ownerId }).where(isNull(table.ownerId)).returning({ id: table.id });
  return rows.length;
}
