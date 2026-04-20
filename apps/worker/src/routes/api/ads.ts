import { Hono } from 'hono';
import { ads, createDb } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ ads: await ads.list(db) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await ads.get(db, c.req.param('id'));
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ad: row });
});

app.get('/:id/zones', async (c) => {
  const db = createDb(c.env.DB);
  const zones = await ads.listZonesOf(db, c.req.param('id'));
  return c.json({ zones });
});

app.post('/', async (c) => {
  const body = (await c.req.json()) as {
    productId: string;
    title: string;
    content?: string;
    imageUrl?: string;
    linkUrl: string;
    weight?: number;
    zoneIds?: string[];
  };
  if (!body.productId || !body.title || !body.linkUrl) {
    return c.json({ error: 'productId, title, linkUrl are required' }, 400);
  }
  const db = createDb(c.env.DB);
  const row = await ads.create(db, {
    id: crypto.randomUUID(),
    productId: body.productId,
    title: body.title,
    content: body.content,
    imageUrl: body.imageUrl,
    linkUrl: body.linkUrl,
    weight: body.weight ?? 1,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
  if (body.zoneIds && body.zoneIds.length > 0) {
    await ads.attachToZones(db, row.id, body.zoneIds, body.weight ?? 1);
  }
  return c.json({ ad: row }, 201);
});

app.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const patch = (await c.req.json()) as Partial<{
    title: string;
    content: string;
    imageUrl: string;
    linkUrl: string;
    weight: number;
    status: 'active' | 'paused';
  }>;
  const row = await ads.update(db, c.req.param('id'), patch);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ad: row });
});

app.post('/:id/zones', async (c) => {
  const body = (await c.req.json()) as { zoneIds: string[]; weight?: number };
  if (!Array.isArray(body.zoneIds) || body.zoneIds.length === 0) {
    return c.json({ error: 'zoneIds is required' }, 400);
  }
  const db = createDb(c.env.DB);
  await ads.attachToZones(db, c.req.param('id'), body.zoneIds, body.weight ?? 1);
  return c.body(null, 204);
});

app.delete('/:id/zones', async (c) => {
  const body = (await c.req.json()) as { zoneIds: string[] };
  if (!Array.isArray(body.zoneIds) || body.zoneIds.length === 0) {
    return c.json({ error: 'zoneIds is required' }, 400);
  }
  const db = createDb(c.env.DB);
  await ads.detachFromZones(db, c.req.param('id'), body.zoneIds);
  return c.body(null, 204);
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await ads.remove(db, c.req.param('id'));
  return c.body(null, 204);
});

export default app;
