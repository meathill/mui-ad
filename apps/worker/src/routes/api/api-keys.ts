import { Hono } from 'hono';
import { apiKeys, createDb } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

// 所有 handler 都要求已登录 session（不允许用 API key 管理 API key）

app.get('/', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const db = createDb(c.env.DB);
  const rows = await apiKeys.listForUser(db, user.id);
  return c.json({ keys: rows });
});

app.post('/', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const body = (await c.req.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim() || 'Untitled key';

  // 生成 32 字节随机，base64url 编码
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = 'muiad_' + base64url(bytes);
  const hash = await sha256Hex(raw);
  const prefix = raw.slice(0, 12); // muiad_XXXXXX

  const db = createDb(c.env.DB);
  const row = await apiKeys.create(db, {
    id: crypto.randomUUID(),
    userId: user.id,
    name,
    hash,
    prefix,
    createdAt: new Date(),
  });

  // 原始 key 只在这一次返回
  return c.json({ key: row, raw }, 201);
});

app.delete('/:id', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const db = createDb(c.env.DB);
  await apiKeys.revoke(db, c.req.param('id'), user.id);
  return c.body(null, 204);
});

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default app;
