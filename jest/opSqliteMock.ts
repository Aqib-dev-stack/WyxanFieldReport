import { createNodeSqlite } from './nodeSqlite';

/**
 * Jest stand-in for `@op-engineering/op-sqlite` (native, can't load in Node).
 * Implements the one method the app uses, on a real in-memory SQLite.
 */
export const open = () => {
  const { executeRaw, database } = createNodeSqlite();
  return { executeRaw, close: () => database.close() };
};
