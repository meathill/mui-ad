'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConfig } from '@/lib/store';

/**
 * Redirects to /setup if no worker URL + api key is stored.
 * Renders `children` once configured; renders a minimal placeholder while
 * hydrating (prevents flash).
 */
export default function RequireKey({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && (!workerUrl || !apiKey)) {
      router.replace('/setup');
    }
  }, [hydrated, workerUrl, apiKey, router]);

  if (!hydrated) return null;
  if (!workerUrl || !apiKey) return null;
  return <>{children}</>;
}
