import type { MiddlewareHandler } from 'hono';
import { apiKeys, createDb } from '@muiad/db';
import { createAuth } from '../auth';
import type { HonoEnv } from '../env';

/**
 * 鉴权优先级：
 * 1. better-auth session cookie  → 该用户
 * 2. `Authorization: Bearer muiad_xxx`  → per-user API key，查表解析出 user
 * 3. `Authorization: Bearer <MUIAD_API_KEY>`  → root key，跨用户可见（CI / 兜底）
 */
export const bearerAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  // 1. session
  if (c.env.BETTER_AUTH_SECRET) {
    try {
      const auth = createAuth(c.env);
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (session?.user) {
        c.set('user', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });
        c.set('isRootKey', false);
        return next();
      }
    } catch {
      // fall through
    }
  }

  const header = c.req.header('Authorization') ?? '';
  const [scheme, token] = header.split(/\s+/, 2);
  const isBearer = scheme?.toLowerCase() === 'bearer' && !!token;

  // 2. per-user API key
  if (isBearer && token.startsWith('muiad_')) {
    const hash = await sha256Hex(token);
    const db = createDb(c.env.DB);
    const key = await apiKeys.findActiveByHash(db, hash);
    if (key) {
      // 异步 touch，不阻塞请求
      c.executionCtx.waitUntil(apiKeys.touch(db, key.id).catch(() => {}));
      // 查 user 基本信息
      const userRow = await c.env.DB.prepare('SELECT id, email, name FROM user WHERE id = ?')
        .bind(key.userId)
        .first<{ id: string; email: string; name: string }>();
      if (userRow) {
        c.set('user', userRow);
        c.set('isRootKey', false);
        return next();
      }
    }
    // 以 muiad_ 开头但查不到就直接 401，不 fall through 到 root key
    return c.json({ error: 'Invalid API key' }, 401);
  }

  // 3. root API key
  const expected = c.env.MUIAD_API_KEY;
  if (expected && isBearer && token === expected) {
    c.set('user', null);
    c.set('isRootKey', true);
    return next();
  }

  return c.json({ error: 'Unauthorized' }, 401);
};

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
