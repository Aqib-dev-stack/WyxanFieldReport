import { open } from '@op-engineering/op-sqlite';

import { applyMigrations } from './migrate';
import migrations from './migrations/migrations';
import { createProxyDatabase } from './proxy';

import type { MigrationBundle } from './migrate';
import type { Scalar } from '@op-engineering/op-sqlite';

/**
 * The app's one SQLite connection.
 *
 * Driver choice: Drizzle's built-in `drizzle-orm/op-sqlite` driver (0.45)
 * calls `executeAsync` / `executeRawAsync` and treats `execute` as sync.
 * Those were removed in op-sqlite 10+, so with op-sqlite 19 selects would
 * silently return []. Drizzle's stable `sqlite-proxy` driver on top of
 * op-sqlite's `executeRaw` avoids that and keeps us off pre-release Drizzle.
 *
 * File: <app data>/databases/wyxan.db on Android (see scripts/pull-db.sh).
 */
export const DATABASE_NAME = 'wyxan.db';

const connection = open({ name: DATABASE_NAME });

const proxy = createProxyDatabase(async (sql, params) => {
  // Drizzle only binds scalars (text, numbers, null), which is what op-sqlite takes.
  const result = await connection.executeRaw(sql, params as Scalar[]);
  return result.rawRows;
});

export const db = proxy.db;

/**
 * Must finish before any other query. Turns on foreign keys (SQLite has
 * them off per connection by default, and image rows rely on ON DELETE
 * CASCADE), switches to WAL (a crash or force-quit can't corrupt committed
 * data, and reads don't block writes), then applies pending migrations.
 */
export const initDatabase = () =>
  proxy.exclusive(async run => {
    await run('PRAGMA foreign_keys = ON', []);
    await run('PRAGMA journal_mode = WAL', []);
    await applyMigrations(run, migrations as MigrationBundle);
  });

/** For repository writes that need several statements in one transaction. */
export const { exclusive } = proxy;
