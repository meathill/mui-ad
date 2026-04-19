import { beforeEach, describe, expect, it } from 'vitest';
import { zones } from '../src/repository';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

const sample = () => ({
  id: crypto.randomUUID(),
  name: 'sidebar 300x250',
  siteUrl: 'https://example.dev',
  width: 300,
  height: 250,
  status: 'active',
  createdAt: new Date().toISOString(),
});

describe('zones repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('create / get / list', async () => {
    const a = await zones.create(db, sample());
    const b = await zones.create(db, {
      ...sample(),
      name: 'header 728x90',
      createdAt: new Date(Date.now() + 1000).toISOString(),
    });
    expect(await zones.get(db, a.id)).toBeDefined();
    expect((await zones.list(db)).map((z) => z.id)).toEqual([b.id, a.id]);
  });

  it('setStatus pauses a zone', async () => {
    const z = await zones.create(db, sample());
    const paused = await zones.setStatus(db, z.id, 'paused');
    expect(paused?.status).toBe('paused');
  });
});
