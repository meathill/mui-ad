'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderId = 'openai' | 'google';

interface ConfigState {
  workerUrl: string | null;
  apiKey: string | null;
  /** BYOK for client-side image providers. Stored only in localStorage. */
  openaiKey: string | null;
  googleKey: string | null;
  setConfig: (workerUrl: string, apiKey: string) => void;
  setProviderKey: (provider: ProviderId, key: string | null) => void;
  clear: () => void;
}

export const DEFAULT_WORKER_URL = process.env.NEXT_PUBLIC_DEFAULT_WORKER_URL ?? 'https://api.muiad.meathill.com';

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      workerUrl: null,
      apiKey: null,
      openaiKey: null,
      googleKey: null,
      setConfig: (workerUrl, apiKey) => set({ workerUrl, apiKey }),
      setProviderKey: (provider, key) =>
        set(provider === 'openai' ? { openaiKey: key || null } : { googleKey: key || null }),
      clear: () => set({ workerUrl: null, apiKey: null, openaiKey: null, googleKey: null }),
    }),
    { name: 'muiad-admin-config' },
  ),
);

export function isConfigured(s: ConfigState) {
  return Boolean(s.workerUrl && s.apiKey);
}

export function hasProviderKey(s: ConfigState, provider: ProviderId) {
  return provider === 'openai' ? Boolean(s.openaiKey) : Boolean(s.googleKey);
}
