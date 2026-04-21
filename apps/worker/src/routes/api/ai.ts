import { createDb, products } from '@muiad/db';
import { Hono } from 'hono';
import type { HonoEnv } from '../../env';

const app = new Hono<HonoEnv>();

// Model name is configurable. Default to gpt-image-1 (known-stable); user
// can switch to gpt-image-2 / any future variant without code change by
// passing { model: "..." } in the request body.
const DEFAULT_MODEL = 'gpt-image-1';
const DEFAULT_SIZE = '1024x1024';

interface BannerRequest {
  product_id: string;
  model?: string;
  size?: string;
  /** Extra style direction appended to the base prompt. */
  style_hint?: string;
}

app.post('/banner', async (c) => {
  if (!c.env.OPENAI_API_KEY) {
    return c.json(
      {
        error: 'OPENAI_API_KEY is not configured. Set it via `wrangler secret put OPENAI_API_KEY`.',
      },
      503,
    );
  }

  let body: BannerRequest;
  try {
    body = (await c.req.json()) as BannerRequest;
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.product_id) {
    return c.json({ error: 'product_id is required' }, 400);
  }

  const db = createDb(c.env.DB);
  const product = await products.get(db, body.product_id);
  if (!product) {
    return c.json({ error: `Unknown product: ${body.product_id}` }, 404);
  }

  const prompt = buildPrompt(product, body.style_hint);
  const size = body.size ?? DEFAULT_SIZE;
  const model = body.model ?? DEFAULT_MODEL;

  const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  });

  if (!openaiRes.ok) {
    const text = await openaiRes.text();
    return c.json(
      { error: `OpenAI ${openaiRes.status}: ${text.slice(0, 500)}` },
      openaiRes.status as 400 | 401 | 403 | 429 | 500,
    );
  }

  const data = (await openaiRes.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = data.data?.[0];
  if (!first) {
    return c.json({ error: 'OpenAI returned no image data' }, 502);
  }

  const bytes = await loadImageBytes(first);
  if (!bytes) {
    return c.json({ error: 'Could not decode OpenAI image response' }, 502);
  }

  const key = `ai-banners/${crypto.randomUUID()}.png`;
  await c.env.UPLOADS.put(key, bytes, {
    httpMetadata: { contentType: 'image/png' },
  });

  return c.json(
    {
      key,
      url: `${c.env.MUIAD_URL}/files/${key}`,
      model,
      size,
      promptPreview: prompt.slice(0, 140),
    },
    201,
  );
});

function buildPrompt(product: { name: string; description?: string | null; url: string }, styleHint?: string): string {
  const base = `Refined editorial-style banner artwork for "${product.name}".
About: ${product.description ?? 'A developer tool / product for software engineers.'}

Style direction:
- Clean, minimal, premium aesthetic; single strong focal element
- Warm neutral background (off-white / paper), one ember-orange accent
- Think New York Times editorial illustration or Apple product photography
- NO embedded text, words, or logos in the image
- AVOID generic AI aesthetics: no purple-blue gradients, no holographic slop,
  no glowing neon on dark backgrounds, no stock-photo crowd-of-people

The image must work as a small embedded ad slot on a developer blog.`;
  return styleHint ? `${base}\n\nExtra direction: ${styleHint}` : base;
}

async function loadImageBytes(entry: { b64_json?: string; url?: string }): Promise<ArrayBuffer | null> {
  if (entry.b64_json) {
    // Base64 decode
    const binary = atob(entry.b64_json);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  if (entry.url) {
    const r = await fetch(entry.url);
    if (!r.ok) return null;
    return r.arrayBuffer();
  }
  return null;
}

export default app;
