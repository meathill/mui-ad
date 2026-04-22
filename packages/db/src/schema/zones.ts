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
  /** 大类：'blog' / 'docs' / 'tool' / 'newsletter' ...—— 用于 scan / 匹配 */
  category: text('category'),
  /** 站点/广告位内容简介，给 Agent / 其他用户看 */
  description: text('description'),
  /** 逗号分隔的标签，例如 "ai,devtools,typescript" */
  tags: text('tags'),
  /** 目标受众简述，自由文本 */
  audience: text('audience'),
  ownerId: text('owner_id'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
