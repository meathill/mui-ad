-- Session 化去重：impressions / clicks / conversions 加 session_id
-- cookie-based，避免靠裸 IP hash 做去重（NAT / 共享网络下 IP 不可靠）

ALTER TABLE impressions ADD COLUMN session_id TEXT;
ALTER TABLE clicks      ADD COLUMN session_id TEXT;
ALTER TABLE conversions ADD COLUMN session_id TEXT;

-- 独立访客查询会用到这三个索引
CREATE INDEX IF NOT EXISTS idx_imp_session   ON impressions(zone_id, session_id);
CREATE INDEX IF NOT EXISTS idx_clk_session   ON clicks(zone_id, session_id);
CREATE INDEX IF NOT EXISTS idx_conv_session  ON conversions(ad_id, session_id);
