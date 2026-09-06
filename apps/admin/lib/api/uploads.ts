import type { RequestFn } from './client';
import type { Api } from './types';

export function createUploads(r: RequestFn): Api['uploads'] {
  return {
    create: async (file) => {
      const form = new FormData();
      form.append('file', file);
      // client.request 碰到 FormData 会自动跳过 JSON Content-Type
      return r<{ key: string; url: string; contentType: string; size: number }>('/uploads', {
        method: 'POST',
        body: form,
      });
    },
  };
}
