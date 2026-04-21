'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * 要求已登录 better-auth session。未登录时跳 /login。
 * 只在 RequireKey 之内使用（workerUrl 已确定，authClient baseURL 才稳定）。
 */
export default function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.replace('/login');
    }
  }, [isPending, data, router]);

  if (isPending) return null;
  if (!data?.user) return null;
  return <>{children}</>;
}
