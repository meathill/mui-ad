import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const impressions = sqliteTable('impressions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: text('zone_id').notNull(),
  adId: text('ad_id').notNull(),
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent'),
  /** Host page URL that rendered the widget. */
  referer: text('referer'),
  /** 来自 muiad_sid cookie，用于独立访客去重；老数据为 NULL */
  sessionId: text('session_id'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
