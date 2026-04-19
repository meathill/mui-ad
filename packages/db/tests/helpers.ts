import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { Db } from '../src/db';
import * as schema from '../src/schema';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'src', 'migrations');

/**
 * Build a fresh in-memory SQLite database, apply all migrations, and
 * return a Drizzle handle compatible with our production `Db` type.
 */
export async function createTestDb(): Promise<Db> {
  const client = createClient({ url: ':memory:' });
  const db = drizzle(client, { schema });

  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const statements = sql
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
  }

  return db as unknown as Db;
}
