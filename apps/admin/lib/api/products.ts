import type { Product } from '@muiad/db';
import type { RequestFn } from './client';
import type { Api } from './types';

export function createProducts(r: RequestFn): Api['products'] {
  return {
    list: async () => (await r<{ products: Product[] }>('/api/products')).products,
    create: async (data) =>
      (
        await r<{ product: Product }>('/api/products', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      ).product,
    update: async (id, patch) =>
      (
        await r<{ product: Product }>(`/api/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      ).product,
    remove: (id) => r<void>(`/api/products/${id}`, { method: 'DELETE' }),
  };
}
