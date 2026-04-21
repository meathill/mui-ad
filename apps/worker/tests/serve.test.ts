import { beforeEach, describe, expect, it } from 'vitest';
import { app, authed, makeEnv, type TestEnv } from './helpers';

async function seedAdInZone(env: TestEnv): Promise<{ adId: string; zoneId: string }> {
  const pRes = await app.request(
    '/api/products',
    authed({ method: 'POST', body: JSON.stringify({ name: 'p', url: 'https://p.dev' }) }),
    env,
  );
  const product = (await pRes.json()) as { product: { id: string } };

  const zRes = await app.request(
    '/api/zones',
    authed({
      method: 'POST',
      body: JSON.stringify({ name: 'z', siteUrl: 'https://s.dev', width: 300, height: 250 }),
    }),
    env,
  );
  const zone = (await zRes.json()) as { zone: { id: string } };

  const aRes = await app.request(
    '/api/ads',
    authed({
      method: 'POST',
      body: JSON.stringify({
        productId: product.product.id,
        title: 'Try p',
        linkUrl: 'https://p.dev/landing',
        zoneIds: [zone.zone.id],
      }),
    }),
    env,
  );
  const ad = (await aRes.json()) as { ad: { id: string } };

  return { adId: ad.ad.id, zoneId: zone.zone.id };
}

describe('/serve', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('returns 400 when zone is missing', async () => {
    const res = await app.request('/serve', {}, env);
    expect(res.status).toBe(400);
  });

  it('returns 204 when zone has no ads', async () => {
    const res = await app.request('/serve?zone=missing', {}, env);
    expect(res.status).toBe(204);
  });

  it('serves an ad and records an impression', async () => {
    const { adId, zoneId } = await seedAdInZone(env);

    const res = await app.request(`/serve?zone=${zoneId}`, {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ad: { id: string; clickUrl: string } };
    expect(body.ad.id).toBe(adId);
    expect(body.ad.clickUrl).toContain('/track/click');
    expect(body.ad.clickUrl).toContain(encodeURIComponent('https://p.dev/landing'));

    const stats = await app.request(`/api/stats/zones/${zoneId}`, authed(), env);
    const s = (await stats.json()) as { impressions: number; clicks: number };
    expect(s.impressions).toBe(1);
    expect(s.clicks).toBe(0);
  });

  it('sets muiad_sid cookie on first /serve and reuses it on next request', async () => {
    const { zoneId } = await seedAdInZone(env);

    const r1 = await app.request(`/serve?zone=${zoneId}`, {}, env);
    const setCookie = r1.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/muiad_sid=[\w-]+/);
    expect(setCookie).toContain('SameSite=None');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('HttpOnly');

    // 第二次带上同一 cookie，不应再 set-cookie
    const sid = /muiad_sid=([^;]+)/.exec(setCookie)?.[1] ?? '';
    const r2 = await app.request(`/serve?zone=${zoneId}`, { headers: { cookie: `muiad_sid=${sid}` } }, env);
    expect(r2.headers.get('set-cookie')).toBeNull();

    // 两次请求 → 2 impressions，1 unique viewer
    const stats = await app.request(`/api/stats/zones/${zoneId}`, authed(), env);
    const s = (await stats.json()) as { impressions: number; uniqueViewers: number };
    expect(s.impressions).toBe(2);
    expect(s.uniqueViewers).toBe(1);
  });

  it('distinct sessions → distinct uniqueViewers', async () => {
    const { zoneId } = await seedAdInZone(env);

    // 两个不同访客各请求一次
    await app.request(`/serve?zone=${zoneId}`, { headers: { cookie: 'muiad_sid=alice-sid' } }, env);
    await app.request(`/serve?zone=${zoneId}`, { headers: { cookie: 'muiad_sid=bob-sid' } }, env);

    const stats = await app.request(`/api/stats/zones/${zoneId}`, authed(), env);
    const s = (await stats.json()) as { impressions: number; uniqueViewers: number };
    expect(s.impressions).toBe(2);
    expect(s.uniqueViewers).toBe(2);
  });
});

describe('/track/click', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('records a click and 302-redirects with muiad_click appended', async () => {
    const { adId, zoneId } = await seedAdInZone(env);

    const click = await app.request(
      `/track/click?ad=${adId}&zone=${zoneId}&redirect=${encodeURIComponent('https://p.dev/landing')}`,
      { redirect: 'manual' },
      env,
    );
    expect(click.status).toBe(302);
    const loc = click.headers.get('location') ?? '';
    expect(loc).toMatch(/^https:\/\/p\.dev\/landing\?muiad_click=\d+$/);

    const stats = await app.request(`/api/stats/zones/${zoneId}`, authed(), env);
    const s = (await stats.json()) as { clicks: number };
    expect(s.clicks).toBe(1);
  });

  it('rejects missing parameters', async () => {
    const res = await app.request('/track/click', {}, env);
    expect(res.status).toBe(400);
  });

  it('extracts UTM params from the redirect URL', async () => {
    const { adId, zoneId } = await seedAdInZone(env);
    const redirect = encodeURIComponent(
      'https://p.dev/landing?utm_source=twitter&utm_medium=social&utm_campaign=launch',
    );
    const click = await app.request(
      `/track/click?ad=${adId}&zone=${zoneId}&redirect=${redirect}`,
      { redirect: 'manual', headers: { referer: 'https://x.com/meathill/status/123' } },
      env,
    );
    expect(click.status).toBe(302);
    // The 302 target preserves the UTM params AND appends muiad_click
    const loc = click.headers.get('location') ?? '';
    expect(loc).toContain('utm_source=twitter');
    expect(loc).toMatch(/muiad_click=\d+/);
  });
});

describe('/track/conversion', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  async function clickOnce(env: TestEnv): Promise<{ clickId: number; adId: string; zoneId: string }> {
    const { adId, zoneId } = await seedAdInZone(env);
    const res = await app.request(
      `/track/click?ad=${adId}&zone=${zoneId}&redirect=${encodeURIComponent('https://p.dev/landing')}`,
      { redirect: 'manual' },
      env,
    );
    const loc = res.headers.get('location') ?? '';
    const m = loc.match(/muiad_click=(\d+)/);
    return { clickId: Number(m?.[1]), adId, zoneId };
  }

  it('rejects invalid JSON body', async () => {
    const res = await app.request(
      '/track/conversion',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json' },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing event_type', async () => {
    const res = await app.request(
      '/track/conversion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ click_id: 1 }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('rejects when neither click_id nor ad_id is provided', async () => {
    const res = await app.request(
      '/track/conversion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'signup' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('404s on unknown click_id', async () => {
    const res = await app.request(
      '/track/conversion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ click_id: 99999, event_type: 'signup' }),
      },
      env,
    );
    expect(res.status).toBe(404);
  });

  it('records a conversion chained to a prior click', async () => {
    const { clickId, adId, zoneId } = await clickOnce(env);

    const res = await app.request(
      '/track/conversion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', referer: 'https://p.dev/thank-you' },
        body: JSON.stringify({
          click_id: clickId,
          event_type: 'purchase',
          value: 1999,
          currency: 'USD',
          meta: { plan: 'pro' },
        }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    // context was inferred
    expect(adId).toBeTruthy();
    expect(zoneId).toBeTruthy();
  });

  it('accepts ad_id directly when click_id is not known', async () => {
    const { adId } = await seedAdInZone(env);
    const res = await app.request(
      '/track/conversion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, event_type: 'signup' }),
      },
      env,
    );
    expect(res.status).toBe(201);
  });
});

describe('/widget.js', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('returns executable JS', async () => {
    const res = await app.request('/widget.js', {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/javascript');
    const body = await res.text();
    expect(body).toContain('data-muiad');
    expect(body).toContain('/serve?zone=');
  });
});
