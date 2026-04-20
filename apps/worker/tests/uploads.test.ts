import { beforeEach, describe, expect, it } from 'vitest';
import { API_KEY, app, makeEnv, type TestEnv } from './helpers';

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
  0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

function uploadForm(bytes: Uint8Array, type: string, filename = 'pic.png'): FormData {
  const form = new FormData();
  form.append('file', new Blob([bytes as BlobPart], { type }), filename);
  return form;
}

describe('/uploads', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('rejects without bearer', async () => {
    const res = await app.request('/uploads', { method: 'POST', body: uploadForm(PNG_BYTES, 'image/png') }, env);
    expect(res.status).toBe(401);
  });

  it('accepts a PNG and returns a public URL', async () => {
    const res = await app.request(
      '/uploads',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: uploadForm(PNG_BYTES, 'image/png'),
      },
      env,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { key: string; url: string; contentType: string; size: number };
    expect(body.key).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(body.url).toBe(`https://test.muiad.local/files/${body.key}`);
    expect(body.contentType).toBe('image/png');
    expect(body.size).toBe(PNG_BYTES.byteLength);
  });

  it('rejects unsupported content-types', async () => {
    const form = new FormData();
    form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'x.txt');
    const res = await app.request(
      '/uploads',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(415);
  });

  it('rejects missing file field', async () => {
    const form = new FormData();
    form.append('notfile', 'x');
    const res = await app.request(
      '/uploads',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('/files/:key', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('serves an uploaded file publicly with correct content-type', async () => {
    const uploadRes = await app.request(
      '/uploads',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: uploadForm(PNG_BYTES, 'image/png'),
      },
      env,
    );
    const { key } = (await uploadRes.json()) as { key: string };

    const res = await app.request(`/files/${key}`, {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('immutable');
  });

  it('returns 404 for missing files', async () => {
    const res = await app.request('/files/missing.png', {}, env);
    expect(res.status).toBe(404);
  });
});
