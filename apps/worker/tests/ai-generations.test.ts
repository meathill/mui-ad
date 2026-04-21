import { beforeEach, describe, expect, it } from 'vitest';
import { app, authed, makeEnv, type TestEnv } from './helpers';

async function createOne(env: TestEnv, overrides: Record<string, unknown> = {}) {
  const body = {
    provider: 'openai',
    model: 'gpt-image-1.5',
    prompt: 'a minimal foo-cli banner',
    original_key: `ai-banners/${crypto.randomUUID()}.png`,
    ...overrides,
  };
  const res = await app.request(
    '/api/ai-generations',
    authed({ method: 'POST', body: JSON.stringify(body) }),
    env,
  );
  return { status: res.status, body: (await res.json()) as { generation?: { id: number } } };
}

describe('/api/ai-generations', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('POST rejects missing required fields', async () => {
    const res = await app.request(
      '/api/ai-generations',
      authed({ method: 'POST', body: JSON.stringify({ provider: 'openai' }) }),
      env,
    );
    expect(res.status).toBe(400);
  });

  it('POST creates and GET lists newest-first', async () => {
    const a = await createOne(env, { prompt: 'one' });
    expect(a.status).toBe(201);
    await createOne(env, { prompt: 'two' });
    const listRes = await app.request('/api/ai-generations', authed(), env);
    const body = (await listRes.json()) as {
      generations: Array<{ prompt: string }>;
    };
    expect(body.generations).toHaveLength(2);
    expect(body.generations[0]?.prompt).toBe('two');
    expect(body.generations[1]?.prompt).toBe('one');
  });

  it('GET filters by product_id', async () => {
    const p1 = crypto.randomUUID();
    const p2 = crypto.randomUUID();
    await createOne(env, { product_id: p1, prompt: 'p1-a' });
    await createOne(env, { product_id: p2, prompt: 'p2-a' });
    const res = await app.request(`/api/ai-generations?product_id=${p1}`, authed(), env);
    const body = (await res.json()) as { generations: Array<{ prompt: string }> };
    expect(body.generations).toHaveLength(1);
    expect(body.generations[0]?.prompt).toBe('p1-a');
  });

  it('DELETE removes', async () => {
    const created = await createOne(env);
    const id = created.body.generation?.id;
    const del = await app.request(`/api/ai-generations/${id}`, authed({ method: 'DELETE' }), env);
    expect(del.status).toBe(204);
    const list = await app.request('/api/ai-generations', authed(), env);
    const body = (await list.json()) as { generations: Array<unknown> };
    expect(body.generations).toHaveLength(0);
  });
});
