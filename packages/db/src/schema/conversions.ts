import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Conversions — advertiser-reported events happening AFTER a click.
 * Called by the advertiser's own landing page / backend via POST /track/conversion.
 */
export const conversions = sqliteTable('conversions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Which ad drove this. Required. */
  adId: text('ad_id').notNull(),
  /** Which zone served it (if known — reconstructed from click_id or passed in). */
  zoneId: text('zone_id'),
  /** Back-reference to clicks.id for the click → conversion chain. */
  clickId: integer('click_id'),
  /** Freeform event name: 'signup' / 'purchase' / 'trial_start' / etc. */
  eventType: text('event_type').notNull(),
  /** Monetary value, stored as integer minor units (e.g. cents) to avoid float. */
  value: integer('value'),
  currency: text('currency'),
  ipHash: text('ip_hash'),
  referer: text('referer'),
  /** Freeform JSON string for advertiser-specific metadata. */
  meta: text('meta'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
