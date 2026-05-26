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
 * - 没有 admin 角色：唯一特权身份是站长（root key / operator）。所有 email/password 用户都是普通用户。
 * - admin plugin 仍开启（保留 role/ban 列与 schema 稳定），但不再给任何人分配 admin。
 * - 公开注册由 /auth/sign-up/email 拦截 gating：只有第一个用户可自助注册；
 *   之后的账号一律由站长（root key）通过 /api/admin/users 创建。
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
