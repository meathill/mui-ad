import type { ProviderId } from '@/lib/store';

export interface GenerateImageInput {
  model: string;
  prompt: string;
  /** Optional size hint like "1024x1024". Providers may ignore. */
  size?: string;
}

export interface GenerateImageResult {
  /** Raw image bytes. */
  bytes: ArrayBuffer;
  /** MIME type (e.g. 'image/png'). */
  contentType: string;
  /** The model actually used (echoed from provider response). */
  model: string;
  provider: ProviderId;
}

export interface ProviderModel {
  id: string;
  label: string;
  defaultSize: string;
  /** Advertised fixed output sizes for this model (informational). */
  sizes: string[];
}

export interface ImageProvider {
  id: ProviderId;
  label: string;
  /** How to get the API key (for UI display). */
  keyUrl: string;
  models: ProviderModel[];
  generate(input: GenerateImageInput, apiKey: string): Promise<GenerateImageResult>;
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
