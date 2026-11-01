import { sql } from 'drizzle-orm';

/**
 * `('a', 'b', 'c')` for a CHECK constraint, built from the same constant
 * array the TypeScript types use, so the two can't drift apart. Values are
 * our own string literals, never user input.
 */
export const sqlInList = (values: readonly string[]) =>
  sql.raw(`(${values.map(value => `'${value}'`).join(', ')})`);
