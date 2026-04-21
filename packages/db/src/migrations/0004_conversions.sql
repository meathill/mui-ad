CREATE TABLE IF NOT EXISTS conversions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id       TEXT NOT NULL,
  zone_id     TEXT,
  click_id    INTEGER,
  event_type  TEXT NOT NULL,
  value       INTEGER,
  currency    TEXT,
  ip_hash     TEXT,
  referer     TEXT,
  meta        TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversions_ad_time ON conversions(ad_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_click   ON conversions(click_id);
