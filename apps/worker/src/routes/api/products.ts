import { Hono } from 'hono';
import { createDb, products } from '@muiad/db';
import type { HonoEnv } from '../../env';
import { badRequest, notFound } from '../../lib/http';
import { getOwnerId } from '../../lib/request-scope';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  // 数据作用域：session 用户 → 按 owner 过滤；root key → undefined 即跨用户
  return c.json({ products: await products.list(db, getOwnerId(c)) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await products.get(db, c.req.param('id'), getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({ product: row });
});

app.post('/', async (c) => {
  const body = (await c.req.json()) as { name: string; url: string; description?: string };
  if (!body.name || !body.url) {
    return badRequest(c, 'name and url are required');
  }
  const db = createDb(c.env.DB);
  const row = await products.create(db, {
    id: crypto.randomUUID(),
    name: body.name,
    url: body.url,
    description: body.description,
    ownerId: c.var.user?.id ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json({ product: row }, 201);
});

app.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const patch = (await c.req.json()) as Partial<{ name: string; url: string; description: string }>;
  const row = await products.update(db, c.req.param('id'), patch, getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({ product: row });
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await products.remove(db, c.req.param('id'), getOwnerId(c));
  return c.body(null, 204);
});

export default app;
