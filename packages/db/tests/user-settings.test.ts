import { beforeEach, describe, expect, it } from 'vitest';
import { getOrDefault, upsert } from '../src/repository/user-settings';
import { user } from '../src/schema';
import type { Db } from '../src/db';
import { createTestDb } from './helpers';

function seedUser(db: Db, id: string) {
  const now = new Date();
  return db.insert(user).values({ id, name: id, email: `${id}@example.dev`, createdAt: now, updatedAt: now });
}

describe('user-settings repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('returns auto default for unknown user without writing', async () => {
    const s = await getOrDefault(db, 'ghost');
    expect(s).toEqual({ userId: 'ghost', approvalMode: 'auto' });
    // 第二次读还是默认值（没写库就不会变）
    expect((await getOrDefault(db, 'ghost')).approvalMode).toBe('auto');
  });

  it('upserts: insert then update', async () => {
    await seedUser(db, 'alice');
    const created = await upsert(db, 'alice', { approvalMode: 'manual' });
    expect(created.approvalMode).toBe('manual');

    expect((await getOrDefault(db, 'alice')).approvalMode).toBe('manual');

    const updated = await upsert(db, 'alice', { approvalMode: 'warm' });
    expect(updated.approvalMode).toBe('warm');
    expect((await getOrDefault(db, 'alice')).approvalMode).toBe('warm');
  });

  it('scopes settings per user', async () => {
    await seedUser(db, 'alice');
    await seedUser(db, 'bob');
    await upsert(db, 'alice', { approvalMode: 'ai' });
    expect((await getOrDefault(db, 'bob')).approvalMode).toBe('auto');
  });
});
