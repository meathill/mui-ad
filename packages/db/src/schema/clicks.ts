import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const clicks = sqliteTable('clicks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: text('zone_id').notNull(),
  adId: text('ad_id').notNull(),
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent'),
  /** Where the click happened (host page URL from the browser's Referer header). */
  referer: text('referer'),
  /** UTM parameters parsed off the redirect URL; usually the advertiser's campaign tagging. */
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
