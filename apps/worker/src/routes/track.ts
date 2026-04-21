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
  const utm = extractUtm(redirect);
  await stats.recordClick(db, {
    zoneId,
    adId,
    ipHash,
    userAgent: c.req.header('user-agent'),
    referer: c.req.header('referer'),
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    createdAt: new Date().toISOString(),
  });

  return c.redirect(redirect, 302);
});

/**
 * Parse UTM query params from the redirect URL. Returns undefined for missing
 * keys so we don't insert empty strings. Advertisers typically tag their own
 * landing URL with utm_* so we pass it through transparently.
 */
function extractUtm(url: string): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
} {
  try {
    const params = new URL(url).searchParams;
    const pick = (key: string) => params.get(key) || undefined;
    return {
      utm_source: pick('utm_source'),
      utm_medium: pick('utm_medium'),
      utm_campaign: pick('utm_campaign'),
    };
  } catch {
    return {};
  }
}

export default app;
