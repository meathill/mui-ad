import { describe, expect, it } from 'vitest';
import { PROVIDERS, PROVIDER_LIST } from './index';
import { base64ToArrayBuffer } from './types';

describe('provider 注册表', () => {
  it('openai + google 都注册了', () => {
    expect(PROVIDER_LIST.map((p) => p.id).sort()).toEqual(['google', 'openai']);
    expect(Object.keys(PROVIDERS).sort()).toEqual(['google', 'openai']);
  });

  it('openai 主力 gpt-image-2，gpt-image-1 已下掉', () => {
    const ids = PROVIDERS.openai.models.map((m) => m.id);
    expect(ids).toContain('gpt-image-2');
    expect(ids).toContain('gpt-image-1.5');
    expect(ids).not.toContain('gpt-image-1');
  });

  it('每个 model 都有 defaultSize 且在 sizes 里', () => {
    for (const p of PROVIDER_LIST) {
      for (const m of p.models) {
        expect(m.sizes).toContain(m.defaultSize);
      }
    }
  });
});

describe('base64ToArrayBuffer', () => {
  it('round-trip 还原字节', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    const buf = base64ToArrayBuffer(btoa(bin));
    expect(new Uint8Array(buf)).toEqual(bytes);
  });

  it('空字符串返回空 buffer', () => {
    expect(base64ToArrayBuffer('').byteLength).toBe(0);
  });
});
