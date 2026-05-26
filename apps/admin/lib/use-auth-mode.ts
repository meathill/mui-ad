'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useConfig } from '@/lib/store';

export type AuthMode = 'tenant' | 'operator' | null;

/**
 * 后台两种互斥入场模式（会话优先）：
 * - tenant：有 better-auth 会话 → 普通用户，只看自己的数据。
 * - operator：无会话但配置了根密钥（apiKey）→ 站长（root），唯一特权身份，跨租户全局视角。
 * - null：都没有 → 未登录。
 * 没有 admin 角色：特权只看 isOperator。
 */
export function useAuthMode() {
  const { data, isPending } = authClient.useSession();
  const apiKey = useConfig((s) => s.apiKey);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const user = data?.user ?? null;
  const loading = isPending || !hydrated;

  let mode: AuthMode = null;
  if (user) mode = 'tenant';
  else if (hydrated && apiKey) mode = 'operator';

  const isOperator = mode === 'operator';

  return { loading, mode, user, isOperator };
}
