import { describe, expect, it } from 'vitest';
import { errMsg, formatCtr, formatDateTime, formatHost } from './format';

describe('errMsg', () => {
  it('Error 取 message，非 Error 转字符串', () => {
    expect(errMsg(new Error('boom'))).toBe('boom');
    expect(errMsg('plain')).toBe('plain');
    expect(errMsg(42)).toBe('42');
  });
});

describe('formatHost', () => {
  it('去掉 http(s) 协议头', () => {
    expect(formatHost('https://a.dev/x')).toBe('a.dev/x');
    expect(formatHost('http://a.dev')).toBe('a.dev');
    expect(formatHost('a.dev')).toBe('a.dev');
  });
});

describe('formatCtr', () => {
  it('默认 1 位小数带 %', () => {
    expect(formatCtr(0.185)).toBe('18.5%');
    expect(formatCtr(0)).toBe('0.0%');
  });

  it('支持指定位数', () => {
    expect(formatCtr(1 / 3, 2)).toBe('33.33%');
  });
});

describe('formatDateTime', () => {
  it('与 toLocaleString(zh-CN) 一致', () => {
    const d = new Date('2026-09-06T12:00:00+08:00');
    expect(formatDateTime(d)).toBe(d.toLocaleString('zh-CN'));
    expect(formatDateTime(d.getTime())).toBe(d.toLocaleString('zh-CN'));
  });
});
