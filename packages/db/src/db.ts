import { drizzle } from 'drizzle-orm/d1';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

/**
 * Generic SQLite async drizzle instance with our schema attached.
 * Accepts both D1 (production) and libsql (tests) drivers.
 */
export type Db = BaseSQLiteDatabase<'async', unknown, typeof schema>;

export { schema };
