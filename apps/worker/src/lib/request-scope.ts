import type { Context } from 'hono';
import type { HonoEnv } from '../env';

/** session 用户 → 按 owner 过滤；root key（user 为 null）→ undefined，即跨用户。 */
export function getOwnerId(c: Context<HonoEnv>): string | undefined {
  return c.var.user?.id;
}
