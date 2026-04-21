import { Hono } from 'hono';
import { createDb, stats } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

app.get('/zones/:id', async (c) => {
  const db = createDb(c.env.DB);
  const result = await stats.zoneStats(db, c.req.param('id'));
  return c.json({ zoneId: c.req.param('id'), ...result });
});

app.get('/zones/:id/breakdown', async (c) => {
  const db = createDb(c.env.DB);
  const zoneId = c.req.param('id');
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
  const summary = await stats.conversionsForAd(db, c.req.param('id'));
  return c.json({ adId: c.req.param('id'), ...summary });
});

export default app;
