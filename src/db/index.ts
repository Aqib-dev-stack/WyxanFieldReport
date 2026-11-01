import { db } from './client';
import { createReportsRepository } from './repositories/reportsRepository';

export { DATABASE_NAME, db, initDatabase } from './client';
export type { Database } from './proxy';
export { createReportsRepository } from './repositories/reportsRepository';
export type {
  NewReportInput,
  ReportImagePatch,
  ReportPatch,
  ReportsRepository,
} from './repositories/reportsRepository';

/** App-wide repository on the real connection. */
export const reportsRepository = createReportsRepository(db);
