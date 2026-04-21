import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../src/db';
import { apiKeys as apiKeysRepo } from '../src/repository';
import { createTestDb } from './helpers';

const USER_ID = 'user-1';

async function seedUser(db: Db): Promise<void> {
  // raw insert — bypass better-auth; 只测 api-keys 仓储
  const now = Math.floor(Date.now() / 1000);
  await (
    db as unknown as { $client: { execute: (sql: { sql: string; args: unknown[] }) => Promise<unknown> } }
  ).$client.execute({
    sql: 'INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [USER_ID, 'Test', 'test@example.com', 0, now, now],
  });
}

function makeKey(overrides: Partial<Parameters<typeof apiKeysRepo.create>[1]> = {}) {
  return {
    id: crypto.randomUUID(),
    userId: USER_ID,
    name: 'test key',
    hash: crypto.randomUUID().replace(/-/g, ''),
    prefix: 'muiad_test',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('api-keys repository', () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
    await seedUser(db);
  });

  it('create / listForUser 不返回 hash，按创建时间降序', async () => {
    const first = await apiKeysRepo.create(db, makeKey({ name: 'first', createdAt: new Date(1000) }));
    const second = await apiKeysRepo.create(db, makeKey({ name: 'second', createdAt: new Date(2000) }));

    const list = await apiKeysRepo.listForUser(db, USER_ID);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);
    expect('hash' in list[0]).toBe(false);
  });

  it('findActiveByHash 命中未撤销的 key', async () => {
    const hash = 'abc123';
    const created = await apiKeysRepo.create(db, makeKey({ hash }));
    const found = await apiKeysRepo.findActiveByHash(db, hash);
    expect(found?.id).toBe(created.id);
  });

  it('revoke 后 findActiveByHash 查不到', async () => {
    const hash = 'def456';
    const created = await apiKeysRepo.create(db, makeKey({ hash }));
    await apiKeysRepo.revoke(db, created.id, USER_ID);
    const found = await apiKeysRepo.findActiveByHash(db, hash);
    expect(found).toBeUndefined();
  });

  it('revoke 只能撤销自己的 key（owner 隔离）', async () => {
    const hash = 'cross-user';
    const created = await apiKeysRepo.create(db, makeKey({ hash }));
    await apiKeysRepo.revoke(db, created.id, 'other-user');
    const found = await apiKeysRepo.findActiveByHash(db, hash);
    expect(found?.id).toBe(created.id);
  });

  it('touch 更新 lastUsedAt', async () => {
    const created = await apiKeysRepo.create(db, makeKey());
    expect(created.lastUsedAt).toBeNull();
    await apiKeysRepo.touch(db, created.id);
    const list = await apiKeysRepo.listForUser(db, USER_ID);
    expect(list[0].lastUsedAt).toBeInstanceOf(Date);
  });

  it('listForUser 按 userId 隔离', async () => {
    await apiKeysRepo.create(db, makeKey());
    const other = await apiKeysRepo.listForUser(db, 'nonexistent');
    expect(other).toEqual([]);
  });
});
