import { ads, createDb, stats } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { clientIp, sha256Hex } from '../lib/hash';
import { ensureSessionId } from '../lib/session';
import { pickWeighted } from '../modules/ad-server/pick';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const zoneId = c.req.query('zone');
  if (!zoneId) {
    return c.json({ error: 'Missing zone parameter' }, 400);
  }

  const db = createDb(c.env.DB);
  const candidates = await ads.listActiveByZone(db, zoneId);
  if (candidates.length === 0) {
    return c.body(null, 204);
  }

  const picked = pickWeighted(candidates.map((c) => ({ item: c.ad, weight: c.weight })));
  if (!picked) return c.body(null, 204);

  const ipHash = await sha256Hex(clientIp(c.req));
  const sessionId = ensureSessionId(c);
  await stats.recordImpression(db, {
    zoneId,
    adId: picked.id,
    ipHash,
    userAgent: c.req.header('user-agent'),
    referer: c.req.header('referer'),
    sessionId,
    createdAt: new Date().toISOString(),
  });

  return c.json({
    ad: {
      id: picked.id,
      title: picked.title,
      content: picked.content,
      imageUrl: picked.imageUrl,
      clickUrl: buildClickUrl(c.env.MUIAD_URL, picked.id, zoneId, picked.linkUrl),
    },
  });
});

function buildClickUrl(baseUrl: string, adId: string, zoneId: string, redirect: string): string {
  const params = new URLSearchParams({ ad: adId, zone: zoneId, redirect });
  return `${baseUrl}/track/click?${params.toString()}`;
}

export default app;
