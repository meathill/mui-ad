CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS zones (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  site_url   TEXT NOT NULL,
  width      INTEGER NOT NULL,
  height     INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ads (
  id         TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  title      TEXT NOT NULL,
  content    TEXT,
  image_url  TEXT,
  link_url   TEXT NOT NULL,
  weight     INTEGER NOT NULL DEFAULT 1,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS zone_ads (
  zone_id TEXT NOT NULL REFERENCES zones(id),
  ad_id   TEXT NOT NULL REFERENCES ads(id),
  weight  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (zone_id, ad_id)
);

CREATE TABLE IF NOT EXISTS impressions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id    TEXT NOT NULL,
  ad_id      TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_impressions_zone_time ON impressions(zone_id, created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_ad_time ON impressions(ad_id, created_at);

CREATE TABLE IF NOT EXISTS clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id    TEXT NOT NULL,
  ad_id      TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  user_agent TEXT,
  referer    TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_zone_time ON clicks(zone_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ad_time ON clicks(ad_id, created_at);
