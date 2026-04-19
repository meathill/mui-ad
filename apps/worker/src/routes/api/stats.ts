import { Hono } from 'hono';
import { createDb, stats } from '@muiad/db';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

app.get('/zones/:id', async (c) => {
  const db = createDb(c.env.DB);
  const result = await stats.zoneStats(db, c.req.param('id'));
  return c.json({ zoneId: c.req.param('id'), ...result });
});

export default app;
