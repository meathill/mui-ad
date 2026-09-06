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
    expect(s).toEqual({ impressions: 0, clicks: 0, ctr: 0, uniqueViewers: 0, uniqueClickers: 0 });
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

  it('aggregates utm sources + top referers + conversions per ad', async () => {
    const now = new Date().toISOString();
    // Mix of utm sources and referers
    await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'a',
      referer: 'https://x.com/meathill/status/1',
      utmSource: 'twitter',
      utmMedium: 'social',
      createdAt: now,
    });
    await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'b',
      referer: 'https://x.com/meathill/status/2',
      utmSource: 'twitter',
      createdAt: now,
    });
    await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'c',
      referer: 'https://news.ycombinator.com/item?id=123',
      utmSource: 'hn',
      createdAt: now,
    });
    await stats.recordClick(db, {
      zoneId: ZONE_ID,
      adId: AD_ID,
      ipHash: 'd',
      referer: null as unknown as undefined,
      createdAt: now,
    });

    const utm = await stats.utmSourcesForZone(db, ZONE_ID);
    const twitter = utm.find((r) => r.source === 'twitter');
    const hn = utm.find((r) => r.source === 'hn');
    const direct = utm.find((r) => r.source === null);
    expect(twitter?.count).toBe(2);
    expect(hn?.count).toBe(1);
    expect(direct?.count).toBe(1);

    const refs = await stats.topReferersForZone(db, ZONE_ID);
    // 4 distinct referer values (including null)
    expect(refs.length).toBeGreaterThanOrEqual(3);
    // sorted desc: all count=1 so ties are fine, just assert total sums
    expect(refs.reduce((s, r) => s + r.count, 0)).toBe(4);

    // Seed a conversion to check aggregation
    await stats.recordConversion(db, {
      adId: AD_ID,
      zoneId: ZONE_ID,
      eventType: 'signup',
      value: 0,
      createdAt: now,
    });
    const conv = await stats.conversionsByAdInZone(db, ZONE_ID);
    expect(conv).toHaveLength(1);
    expect(conv[0]?.adId).toBe(AD_ID);
    expect(conv[0]?.count).toBe(1);
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

  it('adTotals aggregates across zones with ctr', async () => {
    expect(await stats.adTotals(db, AD_ID)).toEqual({
      impressions: 0,
      clicks: 0,
      ctr: 0,
      uniqueViewers: 0,
      uniqueClickers: 0,
    });
    const now = new Date().toISOString();
    for (const zoneId of ['z-a', 'z-b']) {
      for (let i = 0; i < 4; i++) {
        await stats.recordImpression(db, {
          zoneId,
          adId: AD_ID,
          ipHash: `${zoneId}-${i}`,
          sessionId: `${zoneId}-s${i}`,
          createdAt: now,
        });
      }
    }
    await stats.recordClick(db, { zoneId: 'z-a', adId: AD_ID, ipHash: 'c', sessionId: 'z-a-s0', createdAt: now });
    await stats.recordClick(db, { zoneId: 'z-b', adId: AD_ID, ipHash: 'c', sessionId: 'z-b-s0', createdAt: now });

    const t = await stats.adTotals(db, AD_ID);
    expect(t.impressions).toBe(8);
    expect(t.clicks).toBe(2);
    expect(t.ctr).toBeCloseTo(0.25, 5);
    expect(t.uniqueViewers).toBe(8);
    expect(t.uniqueClickers).toBe(2);
  });

  it('adByZone splits one ad per zone', async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < 10; i++) {
      await stats.recordImpression(db, { zoneId: 'hot', adId: AD_ID, ipHash: `h${i}`, createdAt: now });
    }
    for (let i = 0; i < 2; i++) {
      await stats.recordImpression(db, { zoneId: 'cold', adId: AD_ID, ipHash: `c${i}`, createdAt: now });
    }
    await stats.recordClick(db, { zoneId: 'hot', adId: AD_ID, ipHash: 'x', createdAt: now });

    const rows = await stats.adByZone(db, AD_ID);
    const hot = rows.find((r) => r.zoneId === 'hot');
    const cold = rows.find((r) => r.zoneId === 'cold');
    expect(hot).toMatchObject({ impressions: 10, clicks: 1 });
    expect(hot?.ctr).toBeCloseTo(0.1, 5);
    expect(cold).toMatchObject({ impressions: 2, clicks: 0, ctr: 0 });
  });
});
