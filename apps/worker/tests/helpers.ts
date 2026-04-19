import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import app from '../src/index';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', '..', '..', 'packages', 'db', 'src', 'migrations');

export const API_KEY = 'test-key';

export type TestEnv = {
  DB: unknown; // libsql client, typed as D1Database at call boundary
  MUIAD_URL: string;
  MUIAD_API_KEY: string;
};

async function applyMigrations(client: ReturnType<typeof createClient>) {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const statements = sql
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) await client.execute(stmt);
  }
}

/**
 * Wrap a libsql client in a D1Database-compatible shim — only the drizzle
 * calls we actually use (prepare/run/all/first/batch) need to work.
 */
function toD1(client: ReturnType<typeof createClient>): unknown {
  const run = async (sql: string, params: unknown[] = []) => {
    const res = await client.execute({ sql, args: params as never[] });
    return {
      success: true,
      results: res.rows.map((r) => Object.fromEntries(Object.entries(r))),
      meta: {
        duration: 0,
        changes: res.rowsAffected,
        last_row_id: Number(res.lastInsertRowid ?? 0),
      },
    };
  };
  const prepare = (sql: string) => {
    let boundParams: unknown[] = [];
    const stmt: Record<string, unknown> = {
      bind: (...args: unknown[]) => {
        boundParams = args;
        return stmt;
      },
      run: () => run(sql, boundParams),
      all: () => run(sql, boundParams),
      first: async (colName?: string) => {
        const res = await run(sql, boundParams);
        const first = res.results[0];
        if (!first) return null;
        return colName ? (first as Record<string, unknown>)[colName] : first;
      },
      raw: async () => {
        const res = await run(sql, boundParams);
        return res.results.map((r) => Object.values(r));
      },
    };
    return stmt;
  };
  return {
    prepare,
    batch: async (stmts: Array<{ run: () => Promise<unknown> }>) => Promise.all(stmts.map((s) => s.run())),
    exec: (sql: string) => run(sql),
  };
}

export async function makeEnv(): Promise<TestEnv> {
  const client = createClient({ url: ':memory:' });
  await applyMigrations(client);
  return {
    DB: toD1(client),
    MUIAD_URL: 'https://test.muiad.local',
    MUIAD_API_KEY: API_KEY,
  };
}

export function authed(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
}

export { app };
