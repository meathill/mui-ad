'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useConfig } from '@/lib/store';

export type AuthMode = 'tenant' | 'operator' | null;

/**
 * 后台两种互斥入场模式（会话优先）：
 * - tenant：有 better-auth 会话 → 个人视角，只看自己的数据，isAdmin 取决于 role。
 * - operator：无会话但配置了根密钥（apiKey）→ 站长上帝模式，跨租户全局视角，isAdmin 恒真。
 * - null：都没有 → 未登录。
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

  return {
    loading,
    mode,
    user,
    isOperator,
    isAdmin: isOperator || user?.role === 'admin',
  };
}
