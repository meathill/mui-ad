import { beforeEach, describe, expect, it } from 'vitest';
import { stats } from '../src/repository';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

const ZONE_ID = 'zone-1';
const AD_ID = 'ad-1';

describe('stats repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('empty zone returns zeros', async () => {
    const s = await stats.zoneStats(db, ZONE_ID);
    expect(s).toEqual({ impressions: 0, clicks: 0, ctr: 0 });
  });

  it('records impressions and clicks, computes ctr', async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < 10; i++) {
      await stats.recordImpression(db, {
        zoneId: ZONE_ID,
        adId: AD_ID,
        ipHash: `hash-${i}`,
        createdAt: now,
      });
    }
    for (let i = 0; i < 3; i++) {
      await stats.recordClick(db, {
        zoneId: ZONE_ID,
        adId: AD_ID,
        ipHash: `hash-${i}`,
        referer: 'https://example.dev',
        createdAt: now,
      });
    }

    const s = await stats.zoneStats(db, ZONE_ID);
    expect(s.impressions).toBe(10);
    expect(s.clicks).toBe(3);
    expect(s.ctr).toBeCloseTo(0.3, 5);
  });

  it('persists referer + UTM fields on clicks', async () => {
    const now = new Date().toISOString();
    await stats.recordImpression(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'h',
      referer: 'https://host.example',
      createdAt: now,
    });
    await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'h',
      referer: 'https://host.example',
      utmSource: 'twitter',
      utmMedium: 'social',
      utmCampaign: 'launch-mvp0',
      createdAt: now,
    });
    // basic counts
    const s = await stats.zoneStats(db, ZONE_ID);
    expect(s.impressions).toBe(1);
    expect(s.clicks).toBe(1);
  });

  it('isolates stats per zone', async () => {
    const now = new Date().toISOString();
    await stats.recordImpression(db, {
      zoneId: 'other-zone',
      adId: AD_ID,
      ipHash: 'x',
      createdAt: now,
    });
    const s = await stats.zoneStats(db, ZONE_ID);
    expect(s.impressions).toBe(0);
  });
});
