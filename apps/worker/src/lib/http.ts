import type { Context } from 'hono';
import { cors } from 'hono/cors';
import type { HonoEnv } from '../env';

type C = Context<HonoEnv>;

export function notFound(c: C) {
  return c.json({ error: 'Not found' }, 404);
}

export function badRequest(c: C, message: string) {
  return c.json({ error: message }, 400);
}

/** settings / api-keys / approvals 是 per-user 路由，要求登录 session。 */
export function sessionRequired(c: C) {
  return c.json({ error: 'Session required' }, 401);
}

/**
 * credentials: true 要求 origin 是具体值（不能是 *），所以用回显。
 * admin 面板 fetch 带 credentials: 'include'，响应侧必须配这个。
 */
export function credentialedCors(allowHeaders: string[], allowMethods: string[]) {
  return cors({
    origin: (origin) => origin ?? '',
    allowHeaders,
    allowMethods,
    credentials: true,
    maxAge: 600,
  });
}
