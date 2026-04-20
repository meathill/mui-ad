'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  workerUrl: string | null;
  apiKey: string | null;
  setConfig: (workerUrl: string, apiKey: string) => void;
  clear: () => void;
}

export const DEFAULT_WORKER_URL = process.env.NEXT_PUBLIC_DEFAULT_WORKER_URL ?? 'https://api.muiad.meathill.com';

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      workerUrl: null,
      apiKey: null,
      setConfig: (workerUrl, apiKey) => set({ workerUrl, apiKey }),
      clear: () => set({ workerUrl: null, apiKey: null }),
    }),
    { name: 'muiad-admin-config' },
  ),
);

export function isConfigured(s: ConfigState) {
  return Boolean(s.workerUrl && s.apiKey);
}
