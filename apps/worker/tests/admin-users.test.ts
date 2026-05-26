import { beforeEach, describe, expect, it } from 'vitest';
import { app, authed, makeEnv, type TestEnv } from './helpers';

// root key（站长 operator）应能列出 / 创建 / 删除用户 —— 走 requireAdmin 的 isRootKey 放行。
describe('/api/admin/users (root key / operator)', () => {
  let env: TestEnv;
  beforeEach(async () => {
    // 创建用户走 better-auth signUpEmail，需要签名密钥。
    env = { ...(await makeEnv()), BETTER_AUTH_SECRET: 'test-secret' } as TestEnv;
  });

  it('lists users (initially empty)', async () => {
    const res = await app.request('/api/admin/users', authed(), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: unknown[] };
    expect(body.users).toEqual([]);
  });

  it('creates, lists, then deletes a user', async () => {
    const create = await app.request(
      '/api/admin/users',
      authed({
        method: 'POST',
        body: JSON.stringify({ email: 'pub@foo.dev', password: 'pw-at-least-8', name: 'Pub' }),
      }),
      env,
    );
    expect(create.status).toBe(201);
    const { user } = (await create.json()) as { user: { id: string; email: string } };
    expect(user.email).toBe('pub@foo.dev');

    const list = await app.request('/api/admin/users', authed(), env);
    const body = (await list.json()) as { users: Array<{ id: string; email: string }> };
    expect(body.users).toHaveLength(1);
    expect(body.users[0]?.email).toBe('pub@foo.dev');

    const del = await app.request(`/api/admin/users/${user.id}`, authed({ method: 'DELETE' }), env);
    expect(del.status).toBe(204);

    const after = await app.request('/api/admin/users', authed(), env);
    expect(((await after.json()) as { users: unknown[] }).users).toHaveLength(0);
  });

  it('rejects create with missing fields', async () => {
    const res = await app.request(
      '/api/admin/users',
      authed({ method: 'POST', body: JSON.stringify({ email: 'x@y.dev' }) }),
      env,
    );
    expect(res.status).toBe(400);
  });

  it('rejects without bearer', async () => {
    const res = await app.request('/api/admin/users', {}, env);
    expect(res.status).toBe(401);
  });
});
