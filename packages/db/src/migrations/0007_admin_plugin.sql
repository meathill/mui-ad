-- better-auth admin plugin 字段
ALTER TABLE user ADD COLUMN role TEXT;
ALTER TABLE user ADD COLUMN banned INTEGER DEFAULT 0;
ALTER TABLE user ADD COLUMN ban_reason TEXT;
ALTER TABLE user ADD COLUMN ban_expires INTEGER;

ALTER TABLE session ADD COLUMN impersonated_by TEXT;
