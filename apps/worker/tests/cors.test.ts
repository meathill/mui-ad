import { beforeEach, describe, expect, it } from 'vitest';
import { app, makeEnv, type TestEnv } from './helpers';

describe('CORS on authed endpoints', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('preflight OPTIONS /api/zones succeeds without bearer', async () => {
    const res = await app.request(
      '/api/zones',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://muiad-admin.meathill.workers.dev',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      },
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://muiad-admin.meathill.workers.dev');
    const allowHeaders = res.headers.get('access-control-allow-headers') ?? '';
    expect(allowHeaders.toLowerCase()).toContain('authorization');
    const allowMethods = res.headers.get('access-control-allow-methods') ?? '';
    expect(allowMethods).toContain('GET');
    expect(allowMethods).toContain('PATCH');
  });

  it('preflight OPTIONS /mcp succeeds without bearer', async () => {
    const res = await app.request(
      '/mcp',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://muiad-admin.meathill.workers.dev',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      },
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://muiad-admin.meathill.workers.dev');
  });

  it('actual GET /api/zones with bearer carries CORS headers', async () => {
    const res = await app.request(
      '/api/zones',
      {
        headers: {
          Origin: 'https://muiad-admin.meathill.workers.dev',
          Authorization: 'Bearer test-key',
        },
      },
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://muiad-admin.meathill.workers.dev');
  });
});
