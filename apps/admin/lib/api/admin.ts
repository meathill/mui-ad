import type { RequestFn } from './client';
import type { AdminUserDto, Api } from './types';

export function createAdmin(r: RequestFn): Api['admin'] {
  return {
    claimOrphans: () =>
      r<{
        claimed: { products: number; zones: number; ads: number; aiGenerations: number };
        ownerId: string;
      }>('/api/admin/claim-orphans', { method: 'POST', body: '{}' }),
    listUsers: async () => (await r<{ users: AdminUserDto[] }>('/api/admin/users')).users,
    createUser: (data) => r<void>('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    deleteUser: (id) => r<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  };
}
