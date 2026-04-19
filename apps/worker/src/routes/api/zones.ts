import { Hono } from 'hono';
import { createDb, zones } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  return c.json({ zones: await zones.list(db) });
});

app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const row = await zones.get(db, c.req.param('id'));
  if (!row) return c.json({ error: 'Not found' }, 404);
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
  };
  if (!body.name || !body.siteUrl || !body.width || !body.height) {
    return c.json({ error: 'name, siteUrl, width, height are required' }, 400);
  }
  const db = createDb(c.env.DB);
  const row = await zones.create(db, {
    id: crypto.randomUUID(),
    name: body.name,
    siteUrl: body.siteUrl,
    width: body.width,
    height: body.height,
    status: 'active',
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
  }>;
  const row = await zones.update(db, c.req.param('id'), patch);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ zone: row });
});

app.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  await zones.remove(db, c.req.param('id'));
  return c.body(null, 204);
});

function embedSnippet(baseUrl: string, zoneId: string, width: number, height: number): string {
  return `<div data-muiad="${zoneId}" style="width:${width}px;height:${height}px"></div>
<script src="${baseUrl}/widget.js" async></script>`;
}

export default app;
