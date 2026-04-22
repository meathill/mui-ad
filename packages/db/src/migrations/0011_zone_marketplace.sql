-- 给 zone 加"给 Agent / 别的用户看的"描述字段
-- MVP-2 起点：AI agent 需要这些信息去判断广告位和产品是否匹配
-- category: 大类 'blog' / 'docs' / 'tool' / 'newsletter' ...
-- description: 内容简介（自由文本）
-- tags: 逗号分隔，例如 "ai,devtools,typescript"
-- audience: 目标受众简述（自由文本）

ALTER TABLE zones ADD COLUMN category TEXT;
ALTER TABLE zones ADD COLUMN description TEXT;
ALTER TABLE zones ADD COLUMN tags TEXT;
ALTER TABLE zones ADD COLUMN audience TEXT;

CREATE INDEX IF NOT EXISTS idx_zones_category ON zones(category);
