'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthMode } from '@/lib/use-auth-mode';

/**
 * 后台统一鉴权门：
 * - 有 better-auth 会话 → 租户，看自己的数据。
 * - 无会话但配置了根密钥 → 站长（operator），跨租户全局视角。
 * - 都没有 → 跳 /login。
 * hydrate / session 加载期间渲染 null，避免闪烁与水合前的误判。
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, mode } = useAuthMode();

  useEffect(() => {
    if (!loading && mode === null) router.replace('/login');
  }, [loading, mode, router]);

  if (loading || mode === null) return null;
  return <>{children}</>;
}
