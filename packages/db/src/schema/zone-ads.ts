import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ads } from './ads';
import { zones } from './zones';

export type ZoneAdStatus = 'active' | 'pending' | 'rejected';

export const zoneAds = sqliteTable(
  'zone_ads',
  {
    zoneId: text('zone_id')
      .notNull()
      .references(() => zones.id),
    adId: text('ad_id')
      .notNull()
      .references(() => ads.id),
    weight: integer('weight').notNull().default(1),
    /** 'active' / 'pending' / 'rejected'——由 zone 所有者的 approval_mode 决定初值 */
    status: text('status').notNull().default('active'),
    /** 冗余：挂这条的广告主，便于审批列表 join */
    advertiserId: text('advertiser_id'),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
    reviewedBy: text('reviewed_by'),
    reviewNote: text('review_note'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zoneId, table.adId] }),
  }),
);
