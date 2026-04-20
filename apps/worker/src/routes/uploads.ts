import { Hono } from 'hono';
import type { HonoEnv } from '../env';

const app = new Hono<HonoEnv>();

const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['image/svg+xml', 'svg'],
]);

app.post('/', async (c) => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing "file" field (multipart/form-data)' }, 400);
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return c.json(
      { error: `Unsupported content-type "${file.type}". Allowed: ${[...ALLOWED.keys()].join(', ')}` },
      415,
    );
  }
  if (file.size > MAX_BYTES) {
    return c.json({ error: `File too large (${file.size} bytes); max ${MAX_BYTES}` }, 413);
  }

  const key = `${crypto.randomUUID()}.${ext}`;
  const body = await file.arrayBuffer();
  await c.env.UPLOADS.put(key, body, {
    httpMetadata: { contentType: file.type },
  });

  return c.json(
    {
      key,
      url: `${c.env.MUIAD_URL}/files/${key}`,
      contentType: file.type,
      size: file.size,
    },
    201,
  );
});

export default app;
