import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../src/env';
import { moderateAd } from '../src/lib/moderation';

const AD = {
  title: 'jsonformatter.pro',
  content: 'Format JSON fast in your browser',
  linkUrl: 'https://jsonformatter.pro',
};

function envWithAI(run: (model: string) => Promise<unknown>): Env {
  return { AI: { run } } as unknown as Env;
}

const noAI = {} as Env;
const safeTextAI = () => envWithAI(async () => ({ response: '{"safe": true, "reason": "looks fine"}' }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('moderateAd fail-closed 矩阵', () => {
  it('无 AI binding 直接 pending', async () => {
    const r = await moderateAd(noAI, AD);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/AI/);
  });

  it('文本放行 + 无图直接过', async () => {
    const r = await moderateAd(safeTextAI(), AD);
    expect(r.allowed).toBe(true);
  });

  it('文本判不安全就拦', async () => {
    const env = envWithAI(async () => ({ response: '{"safe": false, "reason": "scam wording"}' }));
    const r = await moderateAd(env, AD);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('scam');
  });

  it('文本模型抛异常 fail-closed', async () => {
    const env = envWithAI(async () => {
      throw new Error('model overloaded');
    });
    const r = await moderateAd(env, AD);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/text moderation failed/);
  });

  it('文本返回非 JSON 进 pending', async () => {
    const env = envWithAI(async () => ({ response: 'looks fine to me, no json here' }));
    const r = await moderateAd(env, AD);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/non-JSON/);
  });

  it('markdown 栅栏包着的 JSON 能抠出来', async () => {
    const env = envWithAI(async () => ({ response: '```json\n{"safe": true, "reason": "ok"}\n```' }));
    const r = await moderateAd(env, AD);
    expect(r.allowed).toBe(true);
  });

  it('图片拉不到（HTTP 500）fail-closed', async () => {
    vi.stubGlobal('fetch', async () => new Response('err', { status: 500 }));
    const r = await moderateAd(safeTextAI(), { ...AD, imageUrl: 'https://x.dev/b.png' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/HTTP 500/);
  });

  it('Content-Length 超 2MB 直接拒，不下载', async () => {
    let fetched = false;
    vi.stubGlobal('fetch', async () => {
      fetched = true;
      return new Response('x', { headers: { 'content-length': String(3 * 1024 * 1024) } });
    });
    const r = await moderateAd(safeTextAI(), { ...AD, imageUrl: 'https://x.dev/big.png' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/too large/);
    expect(fetched).toBe(true);
  });

  it('实际字节超 2MB 直接拒', async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    vi.stubGlobal('fetch', async () => new Response(big));
    const r = await moderateAd(safeTextAI(), { ...AD, imageUrl: 'https://x.dev/big.png' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/too large/);
  });

  it('图片 vision 判不安全就拦', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1, 2, 3])));
    const env = envWithAI(async (model: string) =>
      model.includes('llava')
        ? { description: '{"safe": false, "reason": "fake button"}' }
        : { response: '{"safe": true, "reason": "ok"}' },
    );
    const r = await moderateAd(env, { ...AD, imageUrl: 'https://x.dev/b.png' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('fake button');
  });

  it('vision 模型抛异常 fail-closed', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1, 2, 3])));
    const env = envWithAI(async (model: string) => {
      if (model.includes('llava')) throw new Error('vision down');
      return { response: '{"safe": true, "reason": "ok"}' };
    });
    const r = await moderateAd(env, { ...AD, imageUrl: 'https://x.dev/b.png' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/image moderation failed/);
  });

  it('文本 + 图片都过才上线', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1, 2, 3])));
    const env = envWithAI(async (model: string) =>
      model.includes('llava')
        ? { description: '{"safe": true, "reason": "clean banner"}' }
        : { response: '{"safe": true, "reason": "ok"}' },
    );
    const r = await moderateAd(env, { ...AD, imageUrl: 'https://x.dev/b.png' });
    expect(r.allowed).toBe(true);
  });
});
