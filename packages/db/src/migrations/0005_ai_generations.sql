CREATE TABLE IF NOT EXISTS ai_generations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  provider       TEXT NOT NULL,
  model          TEXT NOT NULL,
  prompt         TEXT NOT NULL,
  original_key   TEXT NOT NULL,
  cropped_key    TEXT,
  width          INTEGER,
  height         INTEGER,
  product_id     TEXT,
  ad_id          TEXT,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_gen_created     ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gen_product     ON ai_generations(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_ad          ON ai_generations(ad_id);
