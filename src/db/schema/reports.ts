import { sql } from 'drizzle-orm';
import { check, index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { REPORT_STATUSES } from '@app-types';

import { sqlInList } from './sqlInList';

/**
 * One row per report the inspector saved. The `id` is a UUID made on the
 * phone; the server uses the same id, which is what makes retries safe (an
 * upload repeated after a lost response overwrites, never duplicates).
 *
 * Every state change is written here before the next step starts, so after a
 * force-quit the upload engine resumes from the exact step it was on.
 */
export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    description: text('description').notNull(),
    status: text('status', { enum: REPORT_STATUSES })
      .notNull()
      .default('queued'),
    // ISO 8601 strings written by the app (not CURRENT_TIMESTAMP, whose
    // format has no "T"/"Z" and would sort and parse differently).
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    /** Upload attempts so far; drives the backoff delay. */
    attemptCount: int('attempt_count').notNull().default(0),
    /** Earliest time the engine may try again; null = as soon as possible. */
    nextAttemptAt: text('next_attempt_at'),
    /** User-facing reason for the last failure. */
    lastError: text('last_error'),
    failureKind: text('failure_kind', { enum: ['retryable', 'permanent'] }),
  },
  table => [
    // The upload engine picks work by status and due time.
    index('reports_status_next_attempt_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    // The `enum` above is only a TypeScript type; these make SQLite enforce it.
    check(
      'reports_status_valid',
      sql`${table.status} IN ${sqlInList(REPORT_STATUSES)}`,
    ),
    check(
      'reports_failure_kind_valid',
      sql`${table.failureKind} IS NULL OR ${table.failureKind} IN ('retryable', 'permanent')`,
    ),
    check('reports_attempt_count_valid', sql`${table.attemptCount} >= 0`),
  ],
);

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
