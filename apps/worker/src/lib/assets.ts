import type { Env } from '../env';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB
export const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['image/svg+xml', 'svg'],
]);

export interface StoredAsset {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

/** 把图片字节写入 R2，返回可直接当 image_url 用的公网 URL。key 用 uuid 保证不可变缓存。 */
export async function storeAsset(env: Env, body: ArrayBuffer, contentType: string): Promise<StoredAsset> {
  const ext = ALLOWED_TYPES.get(contentType);
  if (!ext) {
    throw new Error(`Unsupported content-type "${contentType}". Allowed: ${[...ALLOWED_TYPES.keys()].join(', ')}`);
  }
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (${body.byteLength} bytes); max ${MAX_UPLOAD_BYTES}`);
  }

  const key = `${crypto.randomUUID()}.${ext}`;
  await env.UPLOADS.put(key, body, {
    httpMetadata: { contentType },
  });

  return {
    key,
    url: `${env.MUIAD_URL}/files/${key}`,
    contentType,
    size: body.byteLength,
  };
}
