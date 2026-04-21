import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { createDb } from '@muiad/db';
import type { Env } from '../env';

/**
 * Build a betterAuth instance bound to the request-scoped D1.
 * 每次请求都新建一个 instance，因为 D1 binding 来自 c.env，不是 module-scope。
 */
export function createAuth(env: Env) {
  const db = createDb(env.DB);
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.MUIAD_URL,
    basePath: '/auth',
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    trustedOrigins: [
      'https://admin.muiad.meathill.com',
      'https://muiad-admin.meathill.workers.dev',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        domain: '.muiad.meathill.com',
      },
      crossSubDomainCookies: {
        enabled: true,
        domain: '.muiad.meathill.com',
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
