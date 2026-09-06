import type {
  Ad,
  AiGeneration,
  ApiKeyPublic,
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

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: string | null;
  createdAt: string;
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
      category?: string;
      description?: string;
      tags?: string;
      audience?: string;
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
  aiGenerations: {
    create: (input: {
      provider: string;
      model: string;
      prompt: string;
      originalKey: string;
      croppedKey?: string;
      width?: number;
      height?: number;
      productId?: string;
      adId?: string;
    }) => Promise<AiGeneration>;
    list: (filter?: { productId?: string; adId?: string; limit?: number; offset?: number }) => Promise<AiGeneration[]>;
    remove: (id: number) => Promise<void>;
  };
  admin: {
    claimOrphans: () => Promise<{
      claimed: { products: number; zones: number; ads: number; aiGenerations: number };
      ownerId: string;
    }>;
    listUsers: () => Promise<AdminUserDto[]>;
    createUser: (data: { email: string; password: string; name?: string }) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
  };
  apiKeys: {
    list: () => Promise<ApiKeyPublic[]>;
    /** `raw` 只在创建时返回一次；展示完要让用户自己复制走。 */
    create: (name: string) => Promise<{ key: ApiKeyPublic; raw: string }>;
    revoke: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<{ userId: string; approvalMode: 'auto' | 'manual' | 'warm' | 'ai' }>;
    update: (patch: { approvalMode: 'auto' | 'manual' | 'warm' | 'ai' }) => Promise<unknown>;
  };
  approvals: {
    list: () => Promise<
      Array<{
        zoneAd: {
          zoneId: string;
          adId: string;
          advertiserId: string | null;
          createdAt: number | null;
          reviewNote: string | null;
        };
        ad: Ad;
        zone: Zone;
      }>
    >;
    approve: (zoneId: string, adId: string, note?: string) => Promise<void>;
    reject: (zoneId: string, adId: string, note?: string) => Promise<void>;
  };
}
