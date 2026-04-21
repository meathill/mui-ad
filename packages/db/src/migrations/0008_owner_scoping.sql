-- 给业务数据加 owner_id 作数据作用域
-- NULL = 孤儿数据（仅 root key / MCP 可见），迁移时 backfill 到最早注册的用户

ALTER TABLE products ADD COLUMN owner_id TEXT REFERENCES user(id);
ALTER TABLE zones ADD COLUMN owner_id TEXT REFERENCES user(id);
ALTER TABLE ads ADD COLUMN owner_id TEXT REFERENCES user(id);
ALTER TABLE ai_generations ADD COLUMN owner_id TEXT REFERENCES user(id);

-- backfill：把现有数据赋给最早注册的用户
-- 如果 user 表为空则什么都不做（留 NULL，admin 注册后可在 /users 点"认领孤儿数据"）
UPDATE products SET owner_id = (SELECT id FROM user ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;
UPDATE zones SET owner_id = (SELECT id FROM user ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;
UPDATE ads SET owner_id = (SELECT id FROM user ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;
UPDATE ai_generations SET owner_id = (SELECT id FROM user ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_zones_owner ON zones(owner_id);
CREATE INDEX IF NOT EXISTS idx_ads_owner ON ads(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_owner ON ai_generations(owner_id);
