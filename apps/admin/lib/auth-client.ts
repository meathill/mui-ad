import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { DEFAULT_WORKER_URL } from '@/lib/store';

/**
 * 从 localStorage 读 workerUrl（与 BYOK 的 worker 是同一个），
 * fallback 到默认节点。在客户端模块加载时只算一次。
 */
function resolveBaseURL(): string {
  if (typeof window === 'undefined') return DEFAULT_WORKER_URL;
  try {
    const raw = window.localStorage.getItem('muiad-admin-config');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { workerUrl?: string | null } };
      if (parsed.state?.workerUrl) return parsed.state.workerUrl.replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WORKER_URL;
}

const baseURL = resolveBaseURL();

export const workerBaseURL = baseURL;

export const authClient = createAuthClient({
  baseURL: `${baseURL}/auth`,
  plugins: [adminClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
