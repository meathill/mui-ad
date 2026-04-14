import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { products } from "./products";

export const ads = sqliteTable("ads", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id),
  title:     text("title").notNull(),
  content:   text("content"),
  imageUrl:  text("image_url"),
  linkUrl:   text("link_url").notNull(),
  weight:    integer("weight").notNull().default(1),
  status:    text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
