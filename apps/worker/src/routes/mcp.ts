import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { dispatchMcp } from '../mcp/server';

const app = new Hono<HonoEnv>();

app.post('/', async (c) => {
  const body = (await c.req.json()) as unknown;
  const response = await dispatchMcp(body as never, c.env);
  if (response === null) {
    return c.body(null, 204);
  }
  return c.json(response);
});

export default app;
