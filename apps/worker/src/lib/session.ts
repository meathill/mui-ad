import type { Context } from 'hono';

const COOKIE_NAME = 'muiad_sid';
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/**
 * 读请求里的 muiad_sid cookie；若不存在则新建一个 UUID 并在响应头上 set-cookie。
 * 返回 sessionId 供落库用。
 *
 * Cookie 设置成 `SameSite=None; Secure`，因为 /serve 从第三方站点的 widget
 * 发起（cross-origin），Lax 默认值在 iframe/embed 场景下无效。
 */
export function ensureSessionId(c: Context): string {
  const existing = readCookie(c.req.raw.headers.get('cookie'), COOKIE_NAME);
  if (existing) return existing;

  const sid = crypto.randomUUID();
  c.header(
    'Set-Cookie',
    `${COOKIE_NAME}=${sid}; Max-Age=${THIRTY_DAYS_SECONDS}; Path=/; HttpOnly; Secure; SameSite=None`,
    { append: true },
  );
  return sid;
}

/** 只读 —— 不存在就返回 undefined，不会 set cookie。用于 /track/conversion 等场景。 */
export function readSessionId(c: Context): string | undefined {
  return readCookie(c.req.raw.headers.get('cookie'), COOKIE_NAME);
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}
