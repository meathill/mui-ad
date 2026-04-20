import { beforeEach, describe, expect, it } from 'vitest';
import { app, API_KEY, authed, makeEnv, type TestEnv } from './helpers';

describe('/api — authentication', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('rejects missing bearer', async () => {
    const res = await app.request('/api/products', {}, env);
    expect(res.status).toBe(401);
  });

  it('rejects wrong bearer', async () => {
    const res = await app.request('/api/products', { headers: { Authorization: 'Bearer wrong' } }, env);
    expect(res.status).toBe(401);
  });

  it('accepts correct bearer', async () => {
    const res = await app.request('/api/products', authed(), env);
    expect(res.status).toBe(200);
  });
});

describe('/api/products', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('creates and lists a product', async () => {
    const create = await app.request(
      '/api/products',
      authed({
        method: 'POST',
        body: JSON.stringify({ name: 'foo-cli', url: 'https://foo.dev' }),
      }),
      env,
    );
    expect(create.status).toBe(201);
    const { product } = (await create.json()) as { product: { id: string; name: string } };
    expect(product.name).toBe('foo-cli');

    const list = await app.request('/api/products', authed(), env);
    const body = (await list.json()) as { products: Array<{ id: string }> };
    expect(body.products).toHaveLength(1);
    expect(body.products[0]?.id).toBe(product.id);
  });

  it('rejects incomplete payload', async () => {
    const res = await app.request(
      '/api/products',
      authed({ method: 'POST', body: JSON.stringify({ name: 'no-url' }) }),
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('/api/zones', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('creates zone and returns embed snippet', async () => {
    const res = await app.request(
      '/api/zones',
      authed({
        method: 'POST',
        body: JSON.stringify({
          name: 'sidebar',
          siteUrl: 'https://blog.dev',
          width: 300,
          height: 250,
        }),
      }),
      env,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { zone: { id: string }; embedCode: string };
    expect(body.embedCode).toContain(body.zone.id);
    expect(body.embedCode).toContain('widget.js');
  });
});

describe('/api/ads', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  async function createProduct(): Promise<string> {
    const r = await app.request(
      '/api/products',
      authed({
        method: 'POST',
        body: JSON.stringify({ name: 'p', url: 'https://p.dev' }),
      }),
      env,
    );
    return ((await r.json()) as { product: { id: string } }).product.id;
  }

  async function createZone(): Promise<string> {
    const r = await app.request(
      '/api/zones',
      authed({
        method: 'POST',
        body: JSON.stringify({ name: 'z', siteUrl: 'https://s.dev', width: 300, height: 250 }),
      }),
      env,
    );
    return ((await r.json()) as { zone: { id: string } }).zone.id;
  }

  it('creates an ad and attaches it to zones in one call', async () => {
    const productId = await createProduct();
    const zoneId = await createZone();

    const res = await app.request(
      '/api/ads',
      authed({
        method: 'POST',
        body: JSON.stringify({
          productId,
          title: 'Try p',
          linkUrl: 'https://p.dev',
          zoneIds: [zoneId],
          weight: 3,
        }),
      }),
      env,
    );
    expect(res.status).toBe(201);
  });

  it('GET /:id/zones returns the attached zones', async () => {
    const productId = await createProduct();
    const zoneId = await createZone();
    const adRes = await app.request(
      '/api/ads',
      authed({
        method: 'POST',
        body: JSON.stringify({
          productId,
          title: 't',
          linkUrl: 'https://p.dev',
          zoneIds: [zoneId],
          weight: 2,
        }),
      }),
      env,
    );
    const ad = (await adRes.json()) as { ad: { id: string } };

    const res = await app.request(`/api/ads/${ad.ad.id}/zones`, authed(), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { zones: Array<{ zoneId: string; weight: number }> };
    expect(body.zones).toHaveLength(1);
    expect(body.zones[0]?.zoneId).toBe(zoneId);
    expect(body.zones[0]?.weight).toBe(2);
  });
});
