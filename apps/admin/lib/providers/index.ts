import type { ProviderId } from '@/lib/store';
import { googleProvider } from './google';
import { openaiProvider } from './openai';
import type { ImageProvider } from './types';

export const PROVIDERS: Record<ProviderId, ImageProvider> = {
  openai: openaiProvider,
  google: googleProvider,
};

export const PROVIDER_LIST: ImageProvider[] = [openaiProvider, googleProvider];

export type { ImageProvider, ProviderModel, GenerateImageResult } from './types';
