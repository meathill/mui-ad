export interface Env {
  DB: D1Database;
  MUIAD_URL: string;
  /** Set via `wrangler secret put MUIAD_API_KEY`. */
  MUIAD_API_KEY: string;
}

export type HonoEnv = { Bindings: Env };
