import { Hono } from 'hono';
import { ads, createDb, stats, zones } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

// stats 不按 owner 过滤聚合表（展示/点击/转化都是事件流），
// 但入口的 zoneId / adId 归属由 zones.get / ads.get 把关，确保看不到别人家的。
function ownerScope(c: { var: { user: { id: string } | null } }): string | undefined {
  return c.var.user?.id;
}

app.get('/zones/:id', async (c) => {
  const db = createDb(c.env.DB);
  const zoneId = c.req.param('id');
  const zone = await zones.get(db, zoneId, ownerScope(c));
  if (!zone) return c.json({ error: 'Not found' }, 404);
  const result = await stats.zoneStats(db, zoneId);
  return c.json({ zoneId, ...result });
});

app.get('/zones/:id/breakdown', async (c) => {
  const db = createDb(c.env.DB);
  const zoneId = c.req.param('id');
  const zone = await zones.get(db, zoneId, ownerScope(c));
  if (!zone) return c.json({ error: 'Not found' }, 404);
  const [totals, utmSources, referers, conversions] = await Promise.all([
    stats.zoneStats(db, zoneId),
    stats.utmSourcesForZone(db, zoneId),
    stats.topReferersForZone(db, zoneId),
    stats.conversionsByAdInZone(db, zoneId),
  ]);
  return c.json({ zoneId, totals, utmSources, referers, conversions });
});

app.get('/ads/:id/conversions', async (c) => {
  const db = createDb(c.env.DB);
  const adId = c.req.param('id');
  const ad = await ads.get(db, adId, ownerScope(c));
  if (!ad) return c.json({ error: 'Not found' }, 404);
  const summary = await stats.conversionsForAd(db, adId);
  return c.json({ adId, ...summary });
});

export default app;
