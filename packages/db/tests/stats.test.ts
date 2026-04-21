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

  it('records conversion chain and aggregates by event type', async () => {
    const now = new Date().toISOString();
    // simulate a click first, get id
    const click = await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'h',
      referer: 'https://example.com',
      createdAt: now,
    });
    expect(click.id).toBeGreaterThan(0);

    // look up click context
    const ctx = await stats.clickContext(db, click.id);
    expect(ctx?.adId).toBe(AD_ID);
    expect(ctx?.zoneId).toBe(ZONE_ID);

    // two purchases + one signup
    for (const [type, value] of [
      ['purchase', 1999],
      ['purchase', 4999],
      ['signup', 0],
    ] as const) {
      await stats.recordConversion(db, {
        adId: AD_ID,
        zoneId: ZONE_ID,
        clickId: click.id,
        eventType: type,
        value,
        currency: 'USD',
        createdAt: now,
      });
    }

    const summary = await stats.conversionsForAd(db, AD_ID);
    expect(summary.total).toBe(3);
    const purchase = summary.byEventType.find((b) => b.eventType === 'purchase');
    expect(purchase?.count).toBe(2);
    expect(purchase?.totalValue).toBe(6998);
    const signup = summary.byEventType.find((b) => b.eventType === 'signup');
    expect(signup?.count).toBe(1);
    expect(signup?.totalValue).toBe(0);
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
