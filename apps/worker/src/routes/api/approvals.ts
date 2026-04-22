import { ads, createDb } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

/** 列出当前 user 名下 zone 的所有 pending zone_ads */
app.get('/', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const db = createDb(c.env.DB);
  const rows = await ads.listPendingForOwner(db, user.id);
  return c.json({ pending: rows });
});

/** 批准：POST /api/approvals/approve { zoneId, adId, note? } */
app.post('/approve', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const body = (await c.req.json().catch(() => ({}))) as { zoneId?: string; adId?: string; note?: string };
  if (!body.zoneId || !body.adId) {
    return c.json({ error: 'zoneId and adId are required' }, 400);
  }
  const db = createDb(c.env.DB);
  const ok = await ads.reviewAttachment(db, {
    zoneId: body.zoneId,
    adId: body.adId,
    ownerId: user.id,
    decision: 'active',
    note: body.note,
  });
  if (!ok) return c.json({ error: 'Not found or not yours' }, 404);
  return c.json({ ok: true });
});

/** 驳回：POST /api/approvals/reject { zoneId, adId, note? } */
app.post('/reject', async (c) => {
  const user = c.var.user;
  if (!user) return c.json({ error: 'Session required' }, 401);
  const body = (await c.req.json().catch(() => ({}))) as { zoneId?: string; adId?: string; note?: string };
  if (!body.zoneId || !body.adId) {
    return c.json({ error: 'zoneId and adId are required' }, 400);
  }
  const db = createDb(c.env.DB);
  const ok = await ads.reviewAttachment(db, {
    zoneId: body.zoneId,
    adId: body.adId,
    ownerId: user.id,
    decision: 'rejected',
    note: body.note,
  });
  if (!ok) return c.json({ error: 'Not found or not yours' }, 404);
  return c.json({ ok: true });
});

export default app;
