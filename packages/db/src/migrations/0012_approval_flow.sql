-- 广告市场放开：别人的 ad 可以 attach 到你的 zone，但走你设的审批模式
--
-- approval_mode 四档：
--   auto    —— 直接上线
--   manual  —— 必须手动审批
--   warm    —— 如果 zone 已经有 active zone_ads 就自动上线，否则 pending
--   ai      —— 调 Workers AI 审核（Step 2b 实现，暂同 manual 兜底）
--
-- zone_ads.status:
--   active  —— 可被 /serve 选中
--   pending —— 等待审批
--   rejected —— 已驳回（保留历史，不再出现在列表里）

CREATE TABLE IF NOT EXISTS user_settings (
  user_id       TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  approval_mode TEXT NOT NULL DEFAULT 'auto',
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

ALTER TABLE zone_ads ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE zone_ads ADD COLUMN advertiser_id TEXT;
ALTER TABLE zone_ads ADD COLUMN created_at INTEGER;
ALTER TABLE zone_ads ADD COLUMN reviewed_at INTEGER;
ALTER TABLE zone_ads ADD COLUMN reviewed_by TEXT;
ALTER TABLE zone_ads ADD COLUMN review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_zone_ads_status ON zone_ads(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_zone_ads_advertiser ON zone_ads(advertiser_id);
