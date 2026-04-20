import { beforeEach, describe, expect, it } from 'vitest';
import { ads, products, zones } from '../src/repository';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

async function seedContext(db: Db) {
  const now = new Date().toISOString();
  const product = await products.create(db, {
    id: crypto.randomUUID(),
    name: 'foo-cli',
    url: 'https://foo.dev',
    createdAt: now,
  });
  const zoneA = await zones.create(db, {
    id: crypto.randomUUID(),
    name: 'z-a',
    siteUrl: 'https://a.dev',
    width: 300,
    height: 250,
    status: 'active',
    createdAt: now,
  });
  const zoneB = await zones.create(db, {
    id: crypto.randomUUID(),
    name: 'z-b',
    siteUrl: 'https://b.dev',
    width: 728,
    height: 90,
    status: 'active',
    createdAt: now,
  });
  return { product, zoneA, zoneB };
}

describe('ads repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('create + attach to zones + listActiveByZone', async () => {
    const { product, zoneA, zoneB } = await seedContext(db);
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: product.id,
      title: 'Try foo-cli',
      linkUrl: 'https://foo.dev',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    await ads.attachToZones(db, ad.id, [zoneA.id, zoneB.id], 2);

    const aList = await ads.listActiveByZone(db, zoneA.id);
    expect(aList).toHaveLength(1);
    expect(aList[0]?.ad.id).toBe(ad.id);
    expect(aList[0]?.weight).toBe(2);
  });

  it('paused ads are excluded from listActiveByZone', async () => {
    const { product, zoneA } = await seedContext(db);
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: product.id,
      title: 'paused',
      linkUrl: 'https://foo.dev',
      status: 'paused',
      createdAt: new Date().toISOString(),
    });
    await ads.attachToZones(db, ad.id, [zoneA.id]);
    expect(await ads.listActiveByZone(db, zoneA.id)).toEqual([]);
  });

  it('remove() detaches zone_ads first', async () => {
    const { product, zoneA } = await seedContext(db);
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: product.id,
      title: 't',
      linkUrl: 'https://foo.dev',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    await ads.attachToZones(db, ad.id, [zoneA.id]);
    await ads.remove(db, ad.id);
    expect(await ads.listActiveByZone(db, zoneA.id)).toEqual([]);
    expect(await ads.get(db, ad.id)).toBeUndefined();
  });

  it('listZonesOf returns the attached zones with weights', async () => {
    const { product, zoneA, zoneB } = await seedContext(db);
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: product.id,
      title: 't',
      linkUrl: 'https://foo.dev',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    await ads.attachToZones(db, ad.id, [zoneA.id, zoneB.id], 3);
    const rows = await ads.listZonesOf(db, ad.id);
    expect(rows.map((r) => r.zoneId).sort()).toEqual([zoneA.id, zoneB.id].sort());
    expect(rows.every((r) => r.weight === 3)).toBe(true);
  });

  it('detachFromZones removes the join rows', async () => {
    const { product, zoneA, zoneB } = await seedContext(db);
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: product.id,
      title: 't',
      linkUrl: 'https://foo.dev',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    await ads.attachToZones(db, ad.id, [zoneA.id, zoneB.id]);
    await ads.detachFromZones(db, ad.id, [zoneA.id]);
    expect(await ads.listActiveByZone(db, zoneA.id)).toEqual([]);
    expect(await ads.listActiveByZone(db, zoneB.id)).toHaveLength(1);
  });
});
