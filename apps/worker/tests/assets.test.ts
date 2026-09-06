import { describe, expect, it } from 'vitest';
import type { Env } from '../src/env';
import { MAX_UPLOAD_BYTES, storeAsset } from '../src/lib/assets';

function testEnv(): Env {
  const store = new Map<string, { body: ArrayBuffer; contentType?: string }>();
  return {
    UPLOADS: {
      put: async (key: string, body: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }) => {
        store.set(key, { body, contentType: opts?.httpMetadata?.contentType });
      },
    },
    MUIAD_URL: 'https://test.muiad.local',
  } as unknown as Env;
}

const png = (size = 64) => new Uint8Array(size).buffer as ArrayBuffer;

describe('storeAsset 纯函数', () => {
  it('PNG 存 R2 并返回公网 URL', async () => {
    const r = await storeAsset(testEnv(), png(), 'image/png');
    expect(r.key).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(r.url).toBe(`https://test.muiad.local/files/${r.key}`);
    expect(r.contentType).toBe('image/png');
    expect(r.size).toBe(64);
  });

  it('SVG 后缀映射正确', async () => {
    const r = await storeAsset(testEnv(), png(16), 'image/svg+xml');
    expect(r.key.endsWith('.svg')).toBe(true);
  });

  it('不支持的类型直接抛', async () => {
    await expect(storeAsset(testEnv(), png(), 'text/plain')).rejects.toThrow(/Unsupported content-type/);
  });

  it('超 5MB 直接抛', async () => {
    const big = new ArrayBuffer(MAX_UPLOAD_BYTES + 1);
    await expect(storeAsset(testEnv(), big, 'image/png')).rejects.toThrow(/too large/);
  });

  it('恰好 5MB 通过（边界）', async () => {
    const edge = new ArrayBuffer(MAX_UPLOAD_BYTES);
    const r = await storeAsset(testEnv(), edge, 'image/webp');
    expect(r.size).toBe(MAX_UPLOAD_BYTES);
    expect(r.key.endsWith('.webp')).toBe(true);
  });
});
