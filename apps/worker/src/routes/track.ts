import { createDb, stats } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { clientIp, sha256Hex } from '../lib/hash';

const app = new Hono<HonoEnv>();

app.get('/click', async (c) => {
  const adId = c.req.query('ad');
  const zoneId = c.req.query('zone');
  const redirect = c.req.query('redirect');
  if (!adId || !zoneId || !redirect) {
    return c.json({ error: 'Missing required parameters' }, 400);
  }

  const db = createDb(c.env.DB);
  const ipHash = await sha256Hex(clientIp(c.req));
  await stats.recordClick(db, {
    zoneId,
    adId,
    ipHash,
    userAgent: c.req.header('user-agent'),
    referer: c.req.header('referer'),
    createdAt: new Date().toISOString(),
  });

  return c.redirect(redirect, 302);
});

export default app;
