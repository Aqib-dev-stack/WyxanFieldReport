import { defineConfig } from 'drizzle-kit';

/**
 * `npm run db:generate` turns schema changes into SQL migrations.
 * `driver: 'expo'` also writes `migrations.js`, a bundle of the SQL files the
 * app imports at runtime (Drizzle uses the same output for op-sqlite).
 */
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema',
  out: './src/db/migrations',
});
