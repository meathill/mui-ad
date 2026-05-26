import { type Context, Hono } from 'hono';
import { ads, aiGenerations, createDb, products, users, zones } from '@muiad/db';
import { createAuth } from '../../auth';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

/**
 * 只允许 admin role 的会话调用（bearerAuth 已验证 session；这里再查一次 role）。
 * root key 也允许（CI/运维场景），此时 ownerId 必须在 body 指定。
 */
async function requireAdmin(c: Context<HonoEnv>) {
  if (c.var.isRootKey) return null; // 放行
  const user = c.var.user;
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  // biome-ignore lint/suspicious/noExplicitAny: better-auth session type doesn't surface role
  const role = (session?.user as any)?.role;
  if (role !== 'admin') return c.json({ error: 'Forbidden: admin only' }, 403);
  return null;
}

/**
 * 认领所有 owner_id IS NULL 的业务数据到当前 user（或 body.ownerId 指定）。
 * 场景：首次部署、migrate 0008 时还没 user，数据留 NULL；owner 注册后调这个。
 */
app.post('/claim-orphans', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  let targetId: string | undefined = c.var.user?.id;
  if (c.var.isRootKey) {
    const body = (await c.req.json().catch(() => ({}))) as { ownerId?: string };
    targetId = body.ownerId;
    if (!targetId) return c.json({ error: 'ownerId required when calling with root key' }, 400);
  }
  if (!targetId) return c.json({ error: 'no target user' }, 400);

  const db = createDb(c.env.DB);
  const [p, z, a, g] = await Promise.all([
    products.claimOrphans(db, targetId),
    zones.claimOrphans(db, targetId),
    ads.claimOrphans(db, targetId),
    aiGenerations.claimOrphans(db, targetId),
  ]);
  return c.json({ claimed: { products: p, zones: z, ads: a, aiGenerations: g }, ownerId: targetId });
});

/**
 * 用户管理（admin 会话 or root key 都可调）。
 * 注意：创建走 better-auth 的 signUpEmail 以正确哈希密码；role 由 auth 的
 * databaseHooks 决定（首个用户 admin，其余 user），与原 /users 页行为一致。
 */
app.get('/users', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = createDb(c.env.DB);
  return c.json({ users: await users.list(db) });
});

app.post('/users', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string; name?: string };
  const email = body.email?.trim();
  const password = body.password;
  const name = body.name?.trim() || email;
  if (!email || !password) return c.json({ error: 'email 和 password 必填' }, 400);

  const auth = createAuth(c.env);
  try {
    const { user } = await auth.api.signUpEmail({ body: { email, password, name: name as string } });
    return c.json({ user }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : '创建失败' }, 400);
  }
});

app.delete('/users/:id', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const id = c.req.param('id');
  if (c.var.user?.id === id) return c.json({ error: '不能删除自己' }, 400);

  const db = createDb(c.env.DB);
  await users.remove(db, id);
  return c.body(null, 204);
});

export default app;
