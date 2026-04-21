import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../src/db';
import { aiGenerations } from '../src/repository';
import { createTestDb } from './helpers';

const sample = (overrides: Partial<Parameters<typeof aiGenerations.create>[1]> = {}) => ({
  provider: 'openai',
  model: 'gpt-image-1.5',
  prompt: 'a minimal banner for foo-cli',
  originalKey: `ai-banners/${crypto.randomUUID()}.png`,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('ai-generations repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('create / get / list newest-first', async () => {
    const a = await aiGenerations.create(db, sample({ prompt: 'first' }));
    const b = await aiGenerations.create(
      db,
      sample({
        prompt: 'second',
        createdAt: new Date(Date.now() + 1000).toISOString(),
      }),
    );
    expect(await aiGenerations.get(db, a.id)).toBeDefined();
    const rows = await aiGenerations.list(db);
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id]);
  });

  it('filters by productId / adId', async () => {
    const p1 = crypto.randomUUID();
    const p2 = crypto.randomUUID();
    await aiGenerations.create(db, sample({ productId: p1, prompt: 'p1-a' }));
    await aiGenerations.create(db, sample({ productId: p1, prompt: 'p1-b' }));
    await aiGenerations.create(db, sample({ productId: p2, prompt: 'p2-a' }));
    const p1Rows = await aiGenerations.list(db, { productId: p1 });
    expect(p1Rows).toHaveLength(2);
    expect(p1Rows.every((r) => r.productId === p1)).toBe(true);
  });

  it('remove deletes', async () => {
    const row = await aiGenerations.create(db, sample());
    await aiGenerations.remove(db, row.id);
    expect(await aiGenerations.get(db, row.id)).toBeUndefined();
  });
});
