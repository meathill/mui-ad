import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { zones } from "./zones";
import { ads } from "./ads";

export const zoneAds = sqliteTable("zone_ads", {
  zoneId: text("zone_id").notNull().references(() => zones.id),
  adId:   text("ad_id").notNull().references(() => ads.id),
  weight: integer("weight").notNull().default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.zoneId, table.adId] }),
}));
