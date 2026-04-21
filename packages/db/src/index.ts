export { createDb, type Db, schema } from './db';
export * as products from './repository/products';
export * as zones from './repository/zones';
export * as ads from './repository/ads';
export * as stats from './repository/stats';

// Named types re-exported for consumers (e.g. apps/admin api client).
export type { NewProduct, Product } from './repository/products';
export type { NewZone, Zone, ZoneStatus } from './repository/zones';
export type { Ad, AdStatus, NewAd, ZoneAd } from './repository/ads';
export type {
  ConversionByAdRow,
  ConversionsSummary,
  NewConversion,
  RefererRow,
  UtmSourceRow,
  ZoneStats,
} from './repository/stats';
