export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  MUIAD_URL: string;
  /** Set via `wrangler secret put MUIAD_API_KEY`. */
  MUIAD_API_KEY: string;
  /** Set via `wrangler secret put OPENAI_API_KEY`. Optional — only required for /api/ai/*. */
  OPENAI_API_KEY?: string;
}

export type HonoEnv = { Bindings: Env };
