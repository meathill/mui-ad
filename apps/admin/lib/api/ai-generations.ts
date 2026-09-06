import type { AiGeneration } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createAiGenerations(r: RequestFn): Api['aiGenerations'] {
  return {
    create: async (input) =>
      (
        await r<{ generation: AiGeneration }>('/api/ai-generations', {
          method: 'POST',
          body: JSON.stringify({
            provider: input.provider,
            model: input.model,
            prompt: input.prompt,
            original_key: input.originalKey,
            cropped_key: input.croppedKey,
            width: input.width,
            height: input.height,
            product_id: input.productId,
            ad_id: input.adId,
          }),
        })
      ).generation,
    list: async (filter) => {
      const params = new URLSearchParams();
      if (filter?.productId) params.set('product_id', filter.productId);
      if (filter?.adId) params.set('ad_id', filter.adId);
      if (filter?.limit) params.set('limit', String(filter.limit));
      if (filter?.offset) params.set('offset', String(filter.offset));
      const q = params.toString();
      return (await r<{ generations: AiGeneration[] }>(`/api/ai-generations${q ? `?${q}` : ''}`)).generations;
    },
    remove: (id) => r<void>(`/api/ai-generations/${id}`, { method: 'DELETE' }),
  };
}
