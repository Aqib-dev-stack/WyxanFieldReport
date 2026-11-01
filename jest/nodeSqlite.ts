import type { SqlExecutor } from '../src/db/proxy';

/*
 * Node's built-in SQLite, typed locally: pulling in @types/node would add
 * Node's globals (AbortSignal, timers...) to the whole React Native program
 * and clash with React Native's own definitions.
 */
type Statement = {
  columns: () => { name: string }[];
  run: (...params: (string | number | null)[]) => {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  };
  all: (...params: (string | number | null)[]) => unknown[];
  get: (...params: (string | number | null)[]) => unknown;
  setReturnArrays: (enabled: boolean) => void;
};
type DatabaseSyncT = {
  prepare: (sql: string) => Statement;
  close: () => void;
};
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => DatabaseSyncT;
};

/**
 * A real, in-memory SQLite (Node's built-in `node:sqlite`) behind the same
 * `SqlExecutor` contract the app uses on the phone. Lets Jest run the real
 * migrations, constraints and repository queries.
 */
export const createNodeSqlite = () => {
  const database = new DatabaseSync(':memory:');

  const executeRaw = async (sql: string, params: readonly unknown[] = []) => {
    const statement = database.prepare(sql);
    const values = params as (string | number | null)[];
    if (statement.columns().length === 0) {
      const result = statement.run(...values);
      return {
        rawRows: [] as unknown[][],
        columnNames: [] as string[],
        rowsAffected: Number(result.changes),
        insertId: Number(result.lastInsertRowid),
      };
    }
    statement.setReturnArrays(true);
    return {
      rawRows: statement.all(...values) as unknown as unknown[][],
      columnNames: statement.columns().map(column => column.name),
      rowsAffected: 0,
    };
  };

  const execute: SqlExecutor = async (sql, params) =>
    (await executeRaw(sql, params)).rawRows;

  return { database, executeRaw, execute };
};
