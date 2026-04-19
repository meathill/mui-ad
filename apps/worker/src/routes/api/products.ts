import { Hono } from 'hono';
import { createDb, products } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ products: await products.list(db) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await products.get(db, c.req.param('id'));
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
    createdAt: new Date().toISOString(),
  });
  return c.json({ product: row }, 201);
});

app.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const patch = (await c.req.json()) as Partial<{ name: string; url: string; description: string }>;
  const row = await products.update(db, c.req.param('id'), patch);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ product: row });
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await products.remove(db, c.req.param('id'));
  return c.body(null, 204);
});

export default app;
