import { aiGenerations, createDb } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

interface CreateBody {
  provider: string;
  model: string;
  prompt: string;
  original_key: string;
  cropped_key?: string;
  width?: number;
  height?: number;
  product_id?: string;
  ad_id?: string;
}

app.post('/', async (c) => {
  let body: CreateBody;
  try {
    body = (await c.req.json()) as CreateBody;
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.provider || !body.model || !body.prompt || !body.original_key) {
    return c.json({ error: 'provider / model / prompt / original_key are required' }, 400);
  }
  const db = createDb(c.env.DB);
  const row = await aiGenerations.create(db, {
    provider: body.provider,
    model: body.model,
    prompt: body.prompt,
    originalKey: body.original_key,
    croppedKey: body.cropped_key,
    width: body.width,
    height: body.height,
    productId: body.product_id,
    adId: body.ad_id,
    ownerId: c.var.user?.id ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json({ generation: row }, 201);
});

app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const limit = clampInt(c.req.query('limit'), 1, 200, 50);
  const offset = clampInt(c.req.query('offset'), 0, Number.MAX_SAFE_INTEGER, 0);
  const productId = c.req.query('product_id') || undefined;
  const adId = c.req.query('ad_id') || undefined;
  const rows = await aiGenerations.list(db, { productId, adId, limit, offset, ownerId: c.var.user?.id });
  return c.json({ generations: rows });
});

app.delete('/:id', async (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);
  const db = createDb(c.env.DB);
  await aiGenerations.remove(db, id, c.var.user?.id);
  return c.body(null, 204);
});

function clampInt(value: string | undefined, min: number, max: number, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default app;
