import { initDatabase, reportsRepository } from '@db';
import { fileStorage } from '@services/files/fileStorage';
import { uuidv4 } from '@utils/uuid';

import { createReportService } from './reportService';

export { createReportService, InvalidReportError } from './reportService';
export type { ReportService, ReportServiceDeps } from './reportService';

/** The app-wide report service, on the real database and file system. */
export const reportService = createReportService({
  repository: reportsRepository,
  files: fileStorage,
  newId: uuidv4,
  now: () => new Date().toISOString(),
});

/** Startup: open + migrate the database, then load the local reports. */
export const initializeLocalData = async () => {
  await initDatabase();
  await reportService.refresh();
};
