import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const zones = sqliteTable('zones', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  siteUrl: text('site_url').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  status: text('status').notNull().default('active'),
  ownerId: text('owner_id'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
