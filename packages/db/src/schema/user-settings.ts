import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

/**
 * 每用户一行的偏好。目前只有 approval_mode。
 * 不存在时用 'auto' 兜底（见 repository/user-settings）。
 */
export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** 'auto' | 'manual' | 'warm' | 'ai' —— 对他名下 zone 的广告上线策略 */
  approvalMode: text('approval_mode').notNull().default('auto'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type ApprovalMode = 'auto' | 'manual' | 'warm' | 'ai';
