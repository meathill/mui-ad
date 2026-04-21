import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { createDb } from '@muiad/db';
import type { Env } from '../env';

async function userCount(env: Env): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS c FROM user').first<{ c: number }>();
  return Number(row?.c ?? 0);
}

/**
 * Build a betterAuth instance bound to the request-scoped D1.
 * 每次请求都新建 instance（D1 binding 来自 c.env，不是 module-scope）。
 *
 * 策略：
 * - admin plugin 开启；第一个注册的用户自动成为 admin（hook 里数 user 表）
 * - 公开注册由前端 + 外层 /auth/sign-up/email 拦截双重 gating：只有第一个用户可走；
 *   之后新账号只能由 admin 通过 /users 页调 admin.createUser 创建
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
      minPasswordLength: 8,
    },
    plugins: [admin()],
    databaseHooks: {
      user: {
        create: {
          before: async (userData) => {
            const total = await userCount(env);
            return {
              data: {
                ...userData,
                role: total === 0 ? 'admin' : 'user',
              },
            };
          },
        },
      },
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

/**
 * 关闭公开注册：返回 true 表示已经至少有一个用户，前端应隐藏 /signup。
 * Worker 层也会在 /auth/sign-up/email 被调用时、但 user 表非空时拒绝。
 */
export async function hasAnyUser(env: Env): Promise<boolean> {
  return (await userCount(env)) > 0;
}
