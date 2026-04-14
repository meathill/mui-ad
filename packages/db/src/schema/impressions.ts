import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const impressions = sqliteTable('impressions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: text('zone_id').notNull(),
  adId: text('ad_id').notNull(),
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
