-- better-auth core tables (user / session / account / verification)
-- 字段名与 better-auth 默认 schema 保持一致，drizzleAdapter 直接对得上

CREATE TABLE IF NOT EXISTS user (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  image           TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);

CREATE TABLE IF NOT EXISTS session (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  expires_at   INTEGER NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_user   ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token  ON session(token);

CREATE TABLE IF NOT EXISTS account (
  id                         TEXT PRIMARY KEY,
  user_id                    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id                 TEXT NOT NULL,
  provider_id                TEXT NOT NULL,
  access_token               TEXT,
  refresh_token              TEXT,
  access_token_expires_at    INTEGER,
  refresh_token_expires_at   INTEGER,
  scope                      TEXT,
  id_token                   TEXT,
  password                   TEXT,
  created_at                 INTEGER NOT NULL,
  updated_at                 INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_user ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_account_provider ON account(provider_id, account_id);

CREATE TABLE IF NOT EXISTS verification (
  id           TEXT PRIMARY KEY,
  identifier   TEXT NOT NULL,
  value        TEXT NOT NULL,
  expires_at   INTEGER NOT NULL,
  created_at   INTEGER,
  updated_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
