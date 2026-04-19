import { describe, expect, it } from 'vitest';
import { pickWeighted } from '../src/modules/ad-server/pick';

describe('pickWeighted', () => {
  it('returns undefined on empty', () => {
    expect(pickWeighted([])).toBeUndefined();
  });

  it('returns undefined when all weights are zero', () => {
    expect(pickWeighted([{ item: 'a', weight: 0 }])).toBeUndefined();
  });

  it('always picks the only option', () => {
    expect(pickWeighted([{ item: 'solo', weight: 5 }])).toBe('solo');
  });

  it('respects weights with controlled random', () => {
    const candidates = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 9 },
    ];
    // random=0.05 → cursor = 0.5 → falls within a's 0..1 slice
    expect(pickWeighted(candidates, () => 0.05)).toBe('a');
    // random=0.5 → cursor = 5 → past a (1), lands in b
    expect(pickWeighted(candidates, () => 0.5)).toBe('b');
  });
});
