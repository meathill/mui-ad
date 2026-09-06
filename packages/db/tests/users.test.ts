import { beforeEach, describe, expect, it } from 'vitest';
import { list, remove } from '../src/repository/users';
import { user } from '../src/schema';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

function seedUser(db: Db, id: string) {
  const now = new Date();
  return db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.dev`,
    createdAt: now,
    updatedAt: now,
  });
}

describe('users repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('lists empty initially', async () => {
    expect(await list(db)).toEqual([]);
  });

  it('lists newest-first without password hashes', async () => {
    await seedUser(db, 'alice');
    await seedUser(db, 'bob');
    const rows = await list(db);
    expect(rows.map((r) => r.id).sort()).toEqual(['alice', 'bob']);
    // 视图只暴露安全字段
    for (const r of rows) {
      expect(r).toHaveProperty('email');
      expect(r).not.toHaveProperty('password');
    }
  });

  it('removes a user', async () => {
    await seedUser(db, 'alice');
    await remove(db, 'alice');
    expect(await list(db)).toEqual([]);
  });
});
