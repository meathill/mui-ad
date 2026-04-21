import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

/**
 * Per-user API keys for MCP / CI / scripts.
 * Raw key format: `muiad_<32 bytes base64url>`，show once at creation；
 * 只存 sha256 hash + 前 12 字符的可读前缀（展示用）。
 */
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** sha256(rawKey) hex —— 查询 key 时比对这个 */
  hash: text('hash').notNull().unique(),
  /** 可读前缀（muiad_xxxx），仅展示 */
  prefix: text('prefix').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
});
