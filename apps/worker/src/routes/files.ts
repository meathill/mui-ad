import { Hono } from 'hono';
import type { HonoEnv } from '../env';

const app = new Hono<HonoEnv>();

app.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.UPLOADS.get(key);
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', obj.httpEtag);

  return new Response(obj.body, { headers });
});

export default app;
