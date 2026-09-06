import { Hono } from 'hono';
import { createDb, zones } from '@muiad/db';
import type { HonoEnv } from '../../env';
import { badRequest, notFound } from '../../lib/http';
import { getOwnerId } from '../../lib/request-scope';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ zones: await zones.list(db, getOwnerId(c)) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await zones.get(db, c.req.param('id'), getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({
    zone: row,
    embedCode: embedSnippet(c.env.MUIAD_URL, row.id, row.width, row.height),
  });
});

app.post('/', async (c) => {
  const body = (await c.req.json()) as {
    name: string;
    siteUrl: string;
    width: number;
    height: number;
    category?: string;
    description?: string;
    tags?: string;
    audience?: string;
  };
  if (!body.name || !body.siteUrl || !body.width || !body.height) {
    return badRequest(c, 'name, siteUrl, width, height are required');
  }
  const db = createDb(c.env.DB);
  const row = await zones.create(db, {
    id: crypto.randomUUID(),
    name: body.name,
    siteUrl: body.siteUrl,
    width: body.width,
    height: body.height,
    status: 'active',
    category: body.category,
    description: body.description,
    tags: body.tags,
    audience: body.audience,
    ownerId: c.var.user?.id ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json(
    {
      zone: row,
      embedCode: embedSnippet(c.env.MUIAD_URL, row.id, row.width, row.height),
    },
    201,
  );
});

app.patch('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const patch = (await c.req.json()) as Partial<{
    name: string;
    siteUrl: string;
    width: number;
    height: number;
    status: 'active' | 'paused';
    category: string;
    description: string;
    tags: string;
    audience: string;
  }>;
  const row = await zones.update(db, c.req.param('id'), patch, getOwnerId(c));
  if (!row) return notFound(c);
  return c.json({ zone: row });
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await zones.remove(db, c.req.param('id'), getOwnerId(c));
  return c.body(null, 204);
});

function embedSnippet(baseUrl: string, zoneId: string, width: number, height: number): string {
  return `<div data-muiad="${zoneId}" style="width:${width}px;height:${height}px"></div>
<script src="${baseUrl}/widget.js" async></script>`;
}

export default app;
