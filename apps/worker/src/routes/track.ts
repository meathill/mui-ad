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
  const click = await stats.recordClick(db, {
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

  return c.redirect(appendClickId(redirect, click.id), 302);
});

app.post('/conversion', async (c) => {
  let body: ConversionPayload;
  try {
    body = (await c.req.json()) as ConversionPayload;
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.event_type || typeof body.event_type !== 'string') {
    return c.json({ error: 'event_type (string) is required' }, 400);
  }
  if (!body.click_id && !body.ad_id) {
    return c.json({ error: 'Either click_id or ad_id is required' }, 400);
  }

  const db = createDb(c.env.DB);

  let adId = body.ad_id ?? '';
  let zoneId = body.zone_id;
  if (body.click_id) {
    const ctx = await stats.clickContext(db, body.click_id);
    if (!ctx) {
      return c.json({ error: `Unknown click_id: ${body.click_id}` }, 404);
    }
    adId = ctx.adId;
    zoneId = zoneId ?? ctx.zoneId;
  }
  if (!adId) {
    return c.json({ error: 'Could not determine ad_id' }, 400);
  }

  const ipHash = await sha256Hex(clientIp(c.req));
  await stats.recordConversion(db, {
    adId,
    zoneId,
    clickId: body.click_id,
    eventType: body.event_type,
    value: typeof body.value === 'number' ? Math.round(body.value) : undefined,
    currency: body.currency,
    ipHash,
    referer: c.req.header('referer'),
    meta: body.meta ? JSON.stringify(body.meta) : undefined,
    createdAt: new Date().toISOString(),
  });
  return c.json({ ok: true }, 201);
});

interface ConversionPayload {
  click_id?: number;
  ad_id?: string;
  zone_id?: string;
  event_type: string;
  value?: number;
  currency?: string;
  meta?: Record<string, unknown>;
}

/**
 * Append `muiad_click=<id>` to the redirect URL so the advertiser's landing
 * page can POST it back to /track/conversion later. Preserves existing query.
 */
function appendClickId(url: string, clickId: number): string {
  try {
    const u = new URL(url);
    u.searchParams.set('muiad_click', String(clickId));
    return u.toString();
  } catch {
    return url;
  }
}

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
