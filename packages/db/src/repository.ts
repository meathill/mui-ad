import { D1Database } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

class Repository {
  private db: ReturnType<typeof drizzle>;

  constructor(db: D1Database) {
    this.db = drizzle(db, { schema });
  }

  // Products
  async createProduct(data: typeof schema.products.$inferInsert) {
    return this.db.insert(schema.products).values(data).returning();
  }

  async getProducts() {
    return this.db.select().from(schema.products);
  }

  async getProductById(id: string) {
    return this.db.select().from(schema.products).where(schema.products.id.eq(id));
  }

  // Zones
  async createZone(data: typeof schema.zones.$inferInsert) {
    return this.db.insert(schema.zones).values(data).returning();
  }

  async getZones() {
    return this.db.select().from(schema.zones);
  }

  async getZoneById(id: string) {
    return this.db.select().from(schema.zones).where(schema.zones.id.eq(id));
  }

  // Ads
  async createAd(data: typeof schema.ads.$inferInsert) {
    return this.db.insert(schema.ads).values(data).returning();
  }

  async getAds() {
    return this.db.select().from(schema.ads);
  }

  async getAdById(id: string) {
    return this.db.select().from(schema.ads).where(schema.ads.id.eq(id));
  }

  // Zone Ads
  async createZoneAd(data: typeof schema.zoneAds.$inferInsert) {
    return this.db.insert(schema.zoneAds).values(data).returning();
  }

  async getAdsByZoneId(zoneId: string) {
    return this.db
      .select({
        ad: schema.ads,
        weight: schema.zoneAds.weight,
      })
      .from(schema.zoneAds)
      .innerJoin(schema.ads, schema.zoneAds.adId.eq(schema.ads.id))
      .where(schema.zoneAds.zoneId.eq(zoneId))
      .where(schema.ads.status.eq('active'));
  }

  // Impressions
  async createImpression(data: typeof schema.impressions.$inferInsert) {
    return this.db.insert(schema.impressions).values(data).returning();
  }

  // Clicks
  async createClick(data: typeof schema.clicks.$inferInsert) {
    return this.db.insert(schema.clicks).values(data).returning();
  }

  // Stats
  async getZoneStats(zoneId: string) {
    const impressions = await this.db
      .select({ count: schema.impressions.id.count() })
      .from(schema.impressions)
      .where(schema.impressions.zoneId.eq(zoneId));

    const clicks = await this.db
      .select({ count: schema.clicks.id.count() })
      .from(schema.clicks)
      .where(schema.clicks.zoneId.eq(zoneId));

    const impressionCount = impressions[0]?.count || 0;
    const clickCount = clicks[0]?.count || 0;
    const ctr = impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0;

    return {
      impressions: impressionCount,
      clicks: clickCount,
      ctr: ctr.toFixed(2),
    };
  }
}

export default Repository;
