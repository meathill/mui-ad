import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { storeAsset } from '../lib/assets';

const app = new Hono<HonoEnv>();

app.post('/', async (c) => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing "file" field (multipart/form-data)' }, 400);
  }

  // 类型与大小校验以 storeAsset 为准（单源头），这里只做状态码映射。
  try {
    const body = await file.arrayBuffer();
    const asset = await storeAsset(c.env, body, file.type);
    return c.json(asset, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.startsWith('Unsupported content-type')) return c.json({ error: message }, 415);
    if (message.startsWith('File too large')) return c.json({ error: message }, 413);
    throw e;
  }
});

export default app;
