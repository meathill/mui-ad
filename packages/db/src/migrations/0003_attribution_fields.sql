ALTER TABLE impressions ADD COLUMN referer TEXT;

ALTER TABLE clicks ADD COLUMN utm_source TEXT;
ALTER TABLE clicks ADD COLUMN utm_medium TEXT;
ALTER TABLE clicks ADD COLUMN utm_campaign TEXT;
