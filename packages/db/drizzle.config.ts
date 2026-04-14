import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: '../../wrangler.toml',
    dbName: 'muiad-db',
  },
});
