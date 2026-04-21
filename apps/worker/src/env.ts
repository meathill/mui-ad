export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  MUIAD_URL: string;
  /** Set via `wrangler secret put MUIAD_API_KEY`. */
  MUIAD_API_KEY: string;
  /** Set via `wrangler secret put BETTER_AUTH_SECRET`. 用于 session token 签名。 */
  BETTER_AUTH_SECRET: string;
}

export type HonoEnv = {
  Bindings: Env;
  Variables: {
    /** 当前登录用户（来自 better-auth session），未登录为 null。与 Bearer 并存。 */
    user: { id: string; email: string; name: string } | null;
    /** true = 通过 MUIAD_API_KEY 访问（根凭据，跨用户可见）。 */
    isRootKey: boolean;
  };
};
