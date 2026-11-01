import { sql } from 'drizzle-orm';
import {
  check,
  index,
  int,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { reports } from './reports';
import { sqlInList } from './sqlInList';

export const REPORT_IMAGE_STATUSES = [
  'pending',
  'compressed',
  'uploaded',
  'failed',
] as const;

/**
 * One row per photo of a report. Paths point into the app's own storage, so
 * the photo survives the user deleting it from the gallery.
 */
export const reportImages = sqliteTable(
  'report_images',
  {
    id: text('id').primaryKey(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    /** 0–4: the order the user picked; also the slot on the server. */
    position: int('position').notNull(),
    /** Where the photo came from (camera / gallery URI). For reference only. */
    originalUri: text('original_uri').notNull(),
    /** The app's own copy of the original. */
    localPath: text('local_path'),
    /** The compressed file that is actually uploaded (always ≤ 5 MB). */
    compressedPath: text('compressed_path'),
    /** Size of the compressed file in bytes. */
    sizeBytes: int('size_bytes'),
    width: int('width'),
    height: int('height'),
    status: text('status', { enum: REPORT_IMAGE_STATUSES })
      .notNull()
      .default('pending'),
  },
  table => [
    index('report_images_report_id_idx').on(table.reportId),
    // One photo per slot: a retried save can't add a sixth.
    uniqueIndex('report_images_report_position_idx').on(
      table.reportId,
      table.position,
    ),
    check(
      'report_images_position_range',
      sql`${table.position} BETWEEN 0 AND 4`,
    ),
    check(
      'report_images_status_valid',
      sql`${table.status} IN ${sqlInList(REPORT_IMAGE_STATUSES)}`,
    ),
  ],
);

export type ReportImageRow = typeof reportImages.$inferSelect;
export type NewReportImageRow = typeof reportImages.$inferInsert;
