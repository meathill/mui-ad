import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../env';

/**
 * Validates `Authorization: Bearer <MUIAD_API_KEY>`. Applied to all /api/* and /mcp routes.
 * Public-facing endpoints (/serve, /track/*, /widget.js) skip this.
 */
export const bearerAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const expected = c.env.MUIAD_API_KEY;
  if (!expected) {
    return c.json({ error: 'MUIAD_API_KEY is not configured on the server.' }, 500);
  }

  const header = c.req.header('Authorization') ?? '';
  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || token !== expected) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return next();
};
