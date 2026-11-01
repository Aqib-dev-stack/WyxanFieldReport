import { drizzle } from 'drizzle-orm/sqlite-proxy';

import * as schema from './schema';

/**
 * Runs one SQL statement and returns its rows as arrays of values (the shape
 * Drizzle's sqlite-proxy driver expects). On the phone this is op-sqlite's
 * `executeRaw`; in Jest it is Node's built-in SQLite.
 */
export type SqlExecutor = (
  sql: string,
  params: readonly unknown[],
) => Promise<unknown[][]>;

/**
 * Serial queue: each task starts only after the previous one settled.
 *
 * Why: the app has ONE SQLite connection. If two async callers could
 * interleave, a statement from the upload engine might land between another
 * caller's BEGIN and COMMIT and silently become part of its transaction.
 * Queueing every statement (and holding the queue for a whole transaction)
 * rules that out.
 */
export const createSerialQueue = () => {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
};

type Method = 'run' | 'all' | 'values' | 'get';

/** `get` wants a single row (or undefined); the others want all rows. */
const shapeRows = (method: Method, rows: unknown[][]) =>
  method === 'get' ? rows[0] : rows;

/**
 * Drizzle on top of any `SqlExecutor`.
 *
 * - Single statements go through the queue one by one.
 * - `db.batch([...])` runs its statements inside BEGIN/COMMIT while holding
 *   the queue, so a batch is all-or-nothing. Use batch, not
 *   `db.transaction()`, for multi-statement writes: the proxy driver's
 *   transaction() sends BEGIN and COMMIT as separate queued statements.
 * - `exclusive(fn)` gives raw access with the queue held (migrations, pragmas).
 */
export const createProxyDatabase = (execute: SqlExecutor) => {
  const enqueue = createSerialQueue();

  const inTransaction = async <T>(work: () => Promise<T>): Promise<T> => {
    await execute('BEGIN', []);
    try {
      const result = await work();
      await execute('COMMIT', []);
      return result;
    } catch (error) {
      await execute('ROLLBACK', []).catch(() => undefined);
      throw error;
    }
  };

  const db = drizzle(
    (sql, params, method) =>
      enqueue(async () => ({
        rows: shapeRows(method, await execute(sql, params)),
      })),
    batch =>
      enqueue(() =>
        inTransaction(async () => {
          const results = [];
          for (const query of batch) {
            results.push({
              rows: shapeRows(
                query.method,
                await execute(query.sql, query.params),
              ),
            });
          }
          return results;
        }),
      ),
    { schema },
  );

  const exclusive = <T>(fn: (run: SqlExecutor) => Promise<T>) =>
    enqueue(() => fn(execute));

  return { db, exclusive, inTransaction };
};

export type Database = ReturnType<typeof createProxyDatabase>['db'];
export type ProxyDatabase = ReturnType<typeof createProxyDatabase>;
