import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, storeAsset } from '../lib/assets';

const app = new Hono<HonoEnv>();

app.post('/', async (c) => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing "file" field (multipart/form-data)' }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json(
      { error: `Unsupported content-type "${file.type}". Allowed: ${[...ALLOWED_TYPES.keys()].join(', ')}` },
      415,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: `File too large (${file.size} bytes); max ${MAX_UPLOAD_BYTES}` }, 413);
  }

  const body = await file.arrayBuffer();
  const asset = await storeAsset(c.env, body, file.type);

  return c.json(asset, 201);
});

export default app;
