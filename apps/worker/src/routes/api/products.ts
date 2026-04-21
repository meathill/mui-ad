import { Hono } from 'hono';
import { createDb, products } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

// 数据作用域：session 用户 → 按 owner 过滤；root key → undefined 即跨用户
function ownerScope(c: { var: { user: { id: string } | null } }): string | undefined {
  return c.var.user?.id;
}

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ products: await products.list(db, ownerScope(c)) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await products.get(db, c.req.param('id'), ownerScope(c));
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ product: row });
});

app.post('/', async (c) => {
  const body = (await c.req.json()) as { name: string; url: string; description?: string };
  if (!body.name || !body.url) {
    return c.json({ error: 'name and url are required' }, 400);
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
  const row = await products.update(db, c.req.param('id'), patch, ownerScope(c));
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ product: row });
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await products.remove(db, c.req.param('id'), ownerScope(c));
  return c.body(null, 204);
});

export default app;
