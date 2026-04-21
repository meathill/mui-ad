import { describe, expect, it } from 'vitest';
import { clientIp, sha256Hex } from '../src/lib/hash';
import { ensureSessionId, readSessionId } from '../src/lib/session';

type MockHeaders = Record<string, string | undefined>;
function makeReq(headers: MockHeaders) {
  return { header: (name: string) => headers[name.toLowerCase()] };
}

describe('lib/hash', () => {
  it('sha256Hex 得到 64 位小写 hex', async () => {
    const h = await sha256Hex('hello');
    expect(h).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('sha256Hex 同输入稳定', async () => {
    expect(await sha256Hex('x')).toBe(await sha256Hex('x'));
  });

  it('clientIp 优先 cf-connecting-ip', () => {
    expect(clientIp(makeReq({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8' }))).toBe('1.2.3.4');
  });

  it('clientIp 没 CF header 时取 x-forwarded-for 的第一个', () => {
    expect(clientIp(makeReq({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' }))).toBe('9.9.9.9');
  });

  it('clientIp 两个 header 都缺 → 空串', () => {
    expect(clientIp(makeReq({}))).toBe('');
  });
});

type CapturedHeader = { name: string; value: string };
function makeCtx(cookieHeader: string | null) {
  const headers: CapturedHeader[] = [];
  return {
    captured: headers,
    req: { raw: { headers: new Headers(cookieHeader ? { cookie: cookieHeader } : {}) } },
    header(name: string, value: string, _opts?: { append?: boolean }) {
      headers.push({ name, value });
    },
  };
}

describe('lib/session', () => {
  it('首次无 cookie → 生成 sid 并写入 Set-Cookie', () => {
    const ctx = makeCtx(null);
    const sid = ensureSessionId(ctx as never);
    expect(sid).toMatch(/^[0-9a-f-]{36}$/);
    const setCookie = ctx.captured.find((h) => h.name === 'Set-Cookie');
    expect(setCookie?.value).toContain(`muiad_sid=${sid}`);
    expect(setCookie?.value).toContain('HttpOnly');
    expect(setCookie?.value).toContain('Secure');
    expect(setCookie?.value).toContain('SameSite=None');
  });

  it('已有 cookie → 原样返回，不重复 set-cookie', () => {
    const ctx = makeCtx('muiad_sid=abc-123; other=foo');
    const sid = ensureSessionId(ctx as never);
    expect(sid).toBe('abc-123');
    expect(ctx.captured).toEqual([]);
  });

  it('readSessionId 无 cookie 返回 undefined', () => {
    const ctx = makeCtx(null);
    expect(readSessionId(ctx as never)).toBeUndefined();
  });

  it('readSessionId 不写 Set-Cookie', () => {
    const ctx = makeCtx('muiad_sid=zzz');
    expect(readSessionId(ctx as never)).toBe('zzz');
    expect(ctx.captured).toEqual([]);
  });
});
