import { beforeEach, describe, expect, it } from 'vitest';
import { products } from '../src/repository';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

const sample = () => ({
  id: crypto.randomUUID(),
  name: 'foo-cli',
  url: 'https://foo-cli.dev',
  description: 'Zero-config CLI',
  createdAt: new Date().toISOString(),
});

describe('products repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('creates and fetches a product', async () => {
    const created = await products.create(db, sample());
    expect(created.name).toBe('foo-cli');

    const fetched = await products.get(db, created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it('lists products newest-first', async () => {
    await products.create(db, { ...sample(), name: 'a', createdAt: '2026-01-01T00:00:00Z' });
    await products.create(db, { ...sample(), name: 'b', createdAt: '2026-04-01T00:00:00Z' });
    const rows = await products.list(db);
    expect(rows.map((p) => p.name)).toEqual(['b', 'a']);
  });

  it('updates a product', async () => {
    const p = await products.create(db, sample());
    const updated = await products.update(db, p.id, { description: 'changed' });
    expect(updated?.description).toBe('changed');
  });

  it('removes a product', async () => {
    const p = await products.create(db, sample());
    await products.remove(db, p.id);
    expect(await products.get(db, p.id)).toBeUndefined();
  });
});
