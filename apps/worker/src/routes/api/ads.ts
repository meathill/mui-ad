import { Hono } from 'hono';
import { ads, createDb } from '@muiad/db';
import type { HonoEnv } from '../../env';
import { badRequest, notFound } from '../../lib/http';
import { moderateAd } from '../../lib/moderation';
import { getOwnerId } from '../../lib/request-scope';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ ads: await ads.list(db, getOwnerId(c)) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await ads.get(db, c.req.param('id'), getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({ ad: row });
});

app.get('/:id/zones', async (c) => {
  const db = createDb(c.env.DB);
  // 先确认归属
  const ad = await ads.get(db, c.req.param('id'), getOwnerId(c));
  if (!ad) return notFound(c);
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
    return badRequest(c, 'productId, title, linkUrl are required');
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
    ownerId: c.var.user?.id ?? null,
    createdAt: new Date().toISOString(),
  });
  let attach = { active: [] as string[], pending: [] as string[], skipped: [] as string[] };
  if (body.zoneIds && body.zoneIds.length > 0) {
    attach = await ads.attachToZones(db, row.id, body.zoneIds, {
      weight: body.weight ?? 1,
      advertiserId: c.var.user?.id ?? null,
      moderate: ({ ad }) => moderateAd(c.env, ad),
    });
  }
  return c.json({ ad: row, attach }, 201);
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
  const row = await ads.update(db, c.req.param('id'), patch, getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({ ad: row });
});

app.post('/:id/zones', async (c) => {
  const body = (await c.req.json()) as { zoneIds: string[]; weight?: number };
  if (!Array.isArray(body.zoneIds) || body.zoneIds.length === 0) {
    return badRequest(c, 'zoneIds is required');
  }
  const db = createDb(c.env.DB);
  const ad = await ads.get(db, c.req.param('id'), getOwnerId(c));
  if (!ad) return notFound(c);
  const attach = await ads.attachToZones(db, c.req.param('id'), body.zoneIds, {
    weight: body.weight ?? 1,
    advertiserId: c.var.user?.id ?? null,
    moderate: ({ ad }) => moderateAd(c.env, ad),
  });
  return c.json(attach);
});

app.delete('/:id/zones', async (c) => {
  const body = (await c.req.json()) as { zoneIds: string[] };
  if (!Array.isArray(body.zoneIds) || body.zoneIds.length === 0) {
    return badRequest(c, 'zoneIds is required');
  }
  const db = createDb(c.env.DB);
  const ad = await ads.get(db, c.req.param('id'), getOwnerId(c));
  if (!ad) return notFound(c);
  await ads.detachFromZones(db, c.req.param('id'), body.zoneIds);
  return c.body(null, 204);
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await ads.remove(db, c.req.param('id'), getOwnerId(c));
  return c.body(null, 204);
});

export default app;
