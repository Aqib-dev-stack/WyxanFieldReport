/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';

import type { SqlExecutor } from '../src/db/proxy';

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
