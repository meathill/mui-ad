import type { MiddlewareHandler } from 'hono';
import { createAuth } from '../auth';
import type { HonoEnv } from '../env';

/**
 * 鉴权中间件：任一通过即可。
 * 1. `Authorization: Bearer <MUIAD_API_KEY>` —— 根凭据，跨用户可见（MCP/CI/管理员）
 * 2. better-auth session cookie —— 普通用户会话
 *
 * 通过后在 context 上挂 `user`（session 模式下是当前用户；root key 下为 null）
 * 和 `isRootKey` 标记。下游 handler 根据 `isRootKey` 决定是否做数据作用域过滤。
 */
export const bearerAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const expected = c.env.MUIAD_API_KEY;
  const header = c.req.header('Authorization') ?? '';
  const [scheme, token] = header.split(/\s+/, 2);

  // 1. Root API key
  if (expected && scheme?.toLowerCase() === 'bearer' && token === expected) {
    c.set('user', null);
    c.set('isRootKey', true);
    return next();
  }

  // 2. better-auth session
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
      // fall through to 401
    }
  }

  return c.json({ error: 'Unauthorized' }, 401);
};
