import { type Context, Hono } from 'hono';
import { ads, aiGenerations, createDb, products, zones } from '@muiad/db';
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

export default app;
