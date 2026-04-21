import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app, API_KEY, authed, makeEnv, type TestEnv } from './helpers';

// Tiny 1×1 PNG bytes base64 (known valid image)
const TINY_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function seedProduct(env: TestEnv): Promise<string> {
  const res = await app.request(
    '/api/products',
    authed({
      method: 'POST',
      body: JSON.stringify({ name: 'foo-cli', url: 'https://foo.dev', description: 'A tiny CLI' }),
    }),
    env,
  );
  return ((await res.json()) as { product: { id: string } }).product.id;
}

function envWithKey(env: TestEnv, key: string | undefined): TestEnv {
  return { ...env, OPENAI_API_KEY: key } as unknown as TestEnv;
}

describe('/api/ai/banner', () => {
  let env: TestEnv;
  const realFetch = globalThis.fetch;

  beforeEach(async () => {
    env = await makeEnv();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.unstubAllGlobals();
  });

  it('503 when OPENAI_API_KEY is missing', async () => {
    const productId = await seedProduct(env);
    const res = await app.request(
      '/api/ai/banner',
      authed({ method: 'POST', body: JSON.stringify({ product_id: productId }) }),
      envWithKey(env, undefined),
    );
    expect(res.status).toBe(503);
  });

  it('404 for unknown product_id', async () => {
    const res = await app.request(
      '/api/ai/banner',
      authed({ method: 'POST', body: JSON.stringify({ product_id: 'does-not-exist' }) }),
      envWithKey(env, 'sk-test'),
    );
    expect(res.status).toBe(404);
  });

  it('generates and stores the image when OpenAI returns b64_json', async () => {
    const productId = await seedProduct(env);

    // Stub global fetch — only intercept OpenAI; delegate others to real fetch
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('https://api.openai.com/')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        expect(body.prompt).toContain('foo-cli');
        expect(body.size).toBe('1024x1024');
        return new Response(JSON.stringify({ data: [{ b64_json: TINY_PNG_B64 }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return realFetch(input as RequestInfo, init);
    }) as typeof fetch;

    const res = await app.request(
      '/api/ai/banner',
      authed({ method: 'POST', body: JSON.stringify({ product_id: productId }) }),
      envWithKey(env, 'sk-test'),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      key: string;
      url: string;
      model: string;
    };
    expect(body.key).toMatch(/^ai-banners\/[0-9a-f-]{36}\.png$/);
    expect(body.url).toContain('/files/ai-banners/');
    expect(body.model).toBe('gpt-image-1');
  });

  it('passes through OpenAI errors', async () => {
    const productId = await seedProduct(env);
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('https://api.openai.com/')) {
        return new Response(JSON.stringify({ error: { message: 'rate limit' } }), { status: 429 });
      }
      return realFetch(input as RequestInfo);
    }) as typeof fetch;

    const res = await app.request(
      '/api/ai/banner',
      authed({ method: 'POST', body: JSON.stringify({ product_id: productId }) }),
      envWithKey(env, 'sk-test'),
    );
    expect(res.status).toBe(429);
  });
});
