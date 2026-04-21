'use client';

import type {
  Ad,
  ConversionByAdRow,
  ConversionsSummary,
  NewAd,
  NewProduct,
  NewZone,
  Product,
  RefererRow,
  UtmSourceRow,
  Zone,
  ZoneStats,
  ZoneStatus,
} from '@muiad/db';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(workerUrl: string, apiKey: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${workerUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return body;
}

export interface Api {
  products: {
    list: () => Promise<Product[]>;
    create: (data: Pick<NewProduct, 'name' | 'url' | 'description'>) => Promise<Product>;
    update: (id: string, patch: Partial<NewProduct>) => Promise<Product>;
    remove: (id: string) => Promise<void>;
  };
  zones: {
    list: () => Promise<Zone[]>;
    get: (id: string) => Promise<{ zone: Zone; embedCode: string }>;
    create: (data: {
      name: string;
      siteUrl: string;
      width: number;
      height: number;
    }) => Promise<{ zone: Zone; embedCode: string }>;
    update: (id: string, patch: Partial<NewZone>) => Promise<Zone>;
    setStatus: (id: string, status: ZoneStatus) => Promise<Zone>;
    remove: (id: string) => Promise<void>;
  };
  ads: {
    list: () => Promise<Ad[]>;
    get: (id: string) => Promise<Ad>;
    listZones: (id: string) => Promise<Array<{ zoneId: string; weight: number }>>;
    create: (data: {
      productId: string;
      title: string;
      content?: string;
      imageUrl?: string;
      linkUrl: string;
      weight?: number;
      zoneIds?: string[];
    }) => Promise<Ad>;
    update: (id: string, patch: Partial<NewAd>) => Promise<Ad>;
    setStatus: (id: string, status: 'active' | 'paused') => Promise<Ad>;
    remove: (id: string) => Promise<void>;
    attach: (id: string, zoneIds: string[], weight?: number) => Promise<void>;
    detach: (id: string, zoneIds: string[]) => Promise<void>;
  };
  stats: {
    zone: (zoneId: string) => Promise<ZoneStats & { zoneId: string }>;
    zoneBreakdown: (zoneId: string) => Promise<{
      zoneId: string;
      totals: ZoneStats;
      utmSources: UtmSourceRow[];
      referers: RefererRow[];
      conversions: ConversionByAdRow[];
    }>;
    adConversions: (adId: string) => Promise<ConversionsSummary & { adId: string }>;
  };
  uploads: {
    create: (file: File) => Promise<{ key: string; url: string; contentType: string; size: number }>;
  };
}

export function makeApi(workerUrl: string, apiKey: string): Api {
  const r = <T>(path: string, init?: RequestInit) => request<T>(workerUrl, apiKey, path, init);
  return {
    products: {
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
    },
    zones: {
      list: async () => (await r<{ zones: Zone[] }>('/api/zones')).zones,
      get: (id) => r<{ zone: Zone; embedCode: string }>(`/api/zones/${id}`),
      create: (data) =>
        r<{ zone: Zone; embedCode: string }>('/api/zones', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: async (id, patch) =>
        (
          await r<{ zone: Zone }>(`/api/zones/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
        ).zone,
      setStatus: async (id, status) =>
        (
          await r<{ zone: Zone }>(`/api/zones/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          })
        ).zone,
      remove: (id) => r<void>(`/api/zones/${id}`, { method: 'DELETE' }),
    },
    ads: {
      list: async () => (await r<{ ads: Ad[] }>('/api/ads')).ads,
      get: async (id) => (await r<{ ad: Ad }>(`/api/ads/${id}`)).ad,
      listZones: async (id) =>
        (await r<{ zones: Array<{ zoneId: string; weight: number }> }>(`/api/ads/${id}/zones`)).zones,
      create: async (data) => (await r<{ ad: Ad }>('/api/ads', { method: 'POST', body: JSON.stringify(data) })).ad,
      update: async (id, patch) =>
        (
          await r<{ ad: Ad }>(`/api/ads/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
        ).ad,
      setStatus: async (id, status) =>
        (
          await r<{ ad: Ad }>(`/api/ads/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          })
        ).ad,
      remove: (id) => r<void>(`/api/ads/${id}`, { method: 'DELETE' }),
      attach: (id, zoneIds, weight) =>
        r<void>(`/api/ads/${id}/zones`, {
          method: 'POST',
          body: JSON.stringify({ zoneIds, weight }),
        }),
      detach: (id, zoneIds) =>
        r<void>(`/api/ads/${id}/zones`, {
          method: 'DELETE',
          body: JSON.stringify({ zoneIds }),
        }),
    },
    stats: {
      zone: (zoneId) => r<ZoneStats & { zoneId: string }>(`/api/stats/zones/${zoneId}`),
      zoneBreakdown: (zoneId) =>
        r<{
          zoneId: string;
          totals: ZoneStats;
          utmSources: UtmSourceRow[];
          referers: RefererRow[];
          conversions: ConversionByAdRow[];
        }>(`/api/stats/zones/${zoneId}/breakdown`),
      adConversions: (adId) => r<ConversionsSummary & { adId: string }>(`/api/stats/ads/${adId}/conversions`),
    },
    uploads: {
      create: async (file) => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${workerUrl}/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        const body = (await res.json()) as {
          key: string;
          url: string;
          contentType: string;
          size: number;
          error?: string;
        };
        if (!res.ok) {
          throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
        }
        return body;
      },
    },
  };
}

/** Hook-like helper for components: returns null until config is loaded. */
export function apiFromConfig(workerUrl: string | null, apiKey: string | null): Api | null {
  if (!workerUrl || !apiKey) return null;
  return makeApi(workerUrl, apiKey);
}
