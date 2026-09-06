import { beforeEach, describe, expect, it } from 'vitest';
import { app, makeEnv, type TestEnv } from './helpers';
import { sha256Hex } from '../src/lib/hash';

/** 建用户行 + per-user key，返回可直接用的 Authorization header。 */
async function seedUserKey(env: TestEnv, userId: string): Promise<Record<string, string>> {
  const raw = `muiad_${crypto.randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`;
  const hash = await sha256Hex(raw);
  const now = Date.now();
  const db = env.DB as {
    prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<unknown> } };
  };
  await db
    .prepare('INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, userId, `${userId}@t.dev`, now, now)
    .run();
  await db
    .prepare('INSERT INTO api_keys (id, user_id, name, hash, prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), userId, 'test-key', hash, raw.slice(0, 12), now)
    .run();
  return { Authorization: `Bearer ${raw}`, 'Content-Type': 'application/json' };
}

function post(path: string, headers: Record<string, string>, body: unknown, env: TestEnv) {
  return authedRequest(path, { method: 'POST', headers, body: JSON.stringify(body) }, env);
}

/**
 * per-user 鉴权走 c.executionCtx.waitUntil(touch)，Hono 的 authedRequest 默认不带
 * ExecutionContext，这里传一个 mock。生产 Workers 运行时一定有 ctx，不用改生产代码。
 */
const execCtx = {
  waitUntil(_p: Promise<unknown>) {},
  passThroughOnException() {},
} as unknown as ExecutionContext;

function authedRequest(path: string, init: RequestInit, env: TestEnv) {
  return app.request(path, init, env, execCtx);
}

describe('/api/settings（per-user session 视角）', () => {
  let env: TestEnv;
  let alice: Record<string, string>;
  beforeEach(async () => {
    env = await makeEnv();
    alice = await seedUserKey(env, 'alice');
  });

  it('未登录 401；root key 401（要 session）', async () => {
    expect((await authedRequest('/api/settings', {}, env)).status).toBe(401);
    const root = await authedRequest(
      '/api/settings',
      { headers: { Authorization: `Bearer ${(env as { MUIAD_API_KEY: string }).MUIAD_API_KEY}` } },
      env,
    );
    expect(root.status).toBe(401);
  });

  it('默认 auto；PATCH 非法值 400；合法值生效', async () => {
    const get1 = await authedRequest('/api/settings', { headers: alice }, env);
    expect(get1.status).toBe(200);
    expect(((await get1.json()) as { settings: { approvalMode: string } }).settings.approvalMode).toBe('auto');

    const bad = await authedRequest(
      '/api/settings',
      { method: 'PATCH', headers: alice, body: JSON.stringify({ approvalMode: 'nope' }) },
      env,
    );
    expect(bad.status).toBe(400);

    const ok = await authedRequest(
      '/api/settings',
      { method: 'PATCH', headers: alice, body: JSON.stringify({ approvalMode: 'manual' }) },
      env,
    );
    expect(ok.status).toBe(200);
    const get2 = await authedRequest('/api/settings', { headers: alice }, env);
    expect(((await get2.json()) as { settings: { approvalMode: string } }).settings.approvalMode).toBe('manual');
  });
});

describe('/api/approvals（zone 所有者视角）', () => {
  let env: TestEnv;
  let alice: Record<string, string>;
  let bob: Record<string, string>;
  beforeEach(async () => {
    env = await makeEnv();
    alice = await seedUserKey(env, 'alice');
    bob = await seedUserKey(env, 'bob');
  });

  it('root key 401；缺字段 400', async () => {
    const root = await authedRequest(
      '/api/approvals',
      { headers: { Authorization: `Bearer ${(env as { MUIAD_API_KEY: string }).MUIAD_API_KEY}` } },
      env,
    );
    expect(root.status).toBe(401);
    expect((await post('/api/approvals/approve', alice, {}, env)).status).toBe(400);
  });

  it('manual 模式：挂载进 pending → 所有者批准 → 非所有者 404', async () => {
    // alice 开 manual，建 zone
    await authedRequest(
      '/api/settings',
      { method: 'PATCH', headers: alice, body: JSON.stringify({ approvalMode: 'manual' }) },
      env,
    );
    const zoneRes = await post(
      '/api/zones',
      alice,
      { name: 'z1', siteUrl: 'https://a.dev', width: 300, height: 250 },
      env,
    );
    expect(zoneRes.status).toBe(201);
    const zoneId = ((await zoneRes.json()) as { zone: { id: string } }).zone.id;

    // bob 登记产品并挂广告到 alice 的 zone
    const prodRes = await post('/api/products', bob, { name: 'bp', url: 'https://b.dev' }, env);
    const productId = ((await prodRes.json()) as { product: { id: string } }).product.id;
    const adRes = await post(
      '/api/ads',
      bob,
      { productId, title: 't', linkUrl: 'https://b.dev/landing', zoneIds: [zoneId] },
      env,
    );
    expect(adRes.status).toBe(201);
    const adBody = (await adRes.json()) as { ad: { id: string }; attach: { pending: string[]; active: string[] } };
    expect(adBody.attach.pending).toContain(zoneId);

    // alice 看到待审
    const pending = await authedRequest('/api/approvals', { headers: alice }, env);
    expect(pending.status).toBe(200);
    expect(((await pending.json()) as { pending: unknown[] }).pending).toHaveLength(1);

    // bob 不是 zone 所有者，批不动
    expect((await post('/api/approvals/approve', bob, { zoneId, adId: adBody.ad.id }, env)).status).toBe(404);

    // alice 批准
    expect((await post('/api/approvals/approve', alice, { zoneId, adId: adBody.ad.id }, env)).status).toBe(200);
    const after = await authedRequest('/api/approvals', { headers: alice }, env);
    expect(((await after.json()) as { pending: unknown[] }).pending).toHaveLength(0);
  });
});
