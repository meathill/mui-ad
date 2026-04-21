import type { MiddlewareHandler } from 'hono';
import { createAuth } from '../auth';
import type { HonoEnv } from '../env';

/**
 * 鉴权中间件：session 优先 > root API key。
 *
 * 1. 先看 better-auth session cookie：存在则认作该用户（`user` 挂 context）
 * 2. 否则看 `Authorization: Bearer <MUIAD_API_KEY>`：根凭据（MCP / CI）
 *
 * 这个顺序很关键：admin 面板同时带 Bearer 根 key 和 session cookie，
 * 我们要按 session 做数据作用域，不能被 Bearer 一刀切成跨用户可见。
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

  // 2. root API key
  const expected = c.env.MUIAD_API_KEY;
  const header = c.req.header('Authorization') ?? '';
  const [scheme, token] = header.split(/\s+/, 2);
  if (expected && scheme?.toLowerCase() === 'bearer' && token === expected) {
    c.set('user', null);
    c.set('isRootKey', true);
    return next();
  }

  return c.json({ error: 'Unauthorized' }, 401);
};
