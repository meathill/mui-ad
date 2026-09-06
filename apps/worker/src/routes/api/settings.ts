import { createDb, userSettings } from '@muiad/db';
import type { ApprovalMode } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../../env';
import { badRequest, sessionRequired } from '../../lib/http';

const app = new Hono<HonoEnv>();

const MODES: ApprovalMode[] = ['auto', 'manual', 'warm', 'ai'];

app.get('/', async (c) => {
  const user = c.var.user;
  if (!user) return sessionRequired(c);
  const db = createDb(c.env.DB);
  const s = await userSettings.getOrDefault(db, user.id);
  return c.json({ settings: s });
});

app.patch('/', async (c) => {
  const user = c.var.user;
  if (!user) return sessionRequired(c);
  const body = (await c.req.json().catch(() => ({}))) as { approvalMode?: ApprovalMode };
  if (!body.approvalMode || !MODES.includes(body.approvalMode)) {
    return badRequest(c, `approvalMode must be one of ${MODES.join(' / ')}`);
  }
  const db = createDb(c.env.DB);
  const row = await userSettings.upsert(db, user.id, { approvalMode: body.approvalMode });
  return c.json({ settings: row });
});

export default app;
