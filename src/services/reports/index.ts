import { initDatabase, reportsRepository } from '@db';
import { fileStorage, reportFolder } from '@services/files/fileStorage';
import { compressImage } from '@services/images/imageCompressor';
import { createImagePreparer } from '@services/images/imagePreparer';
import { uuidv4 } from '@utils/uuid';

import { createReportService } from './reportService';

export { createReportService, InvalidReportError } from './reportService';
export type { ReportService, ReportServiceDeps } from './reportService';

/**
 * App wiring: the real database, file system and native compressor. Each
 * service takes its dependencies as arguments, so tests build the same
 * services on an in-memory database and fakes.
 */

const runInBackground = (work: Promise<void>) => {
  work.catch(() => undefined); // failures are recorded on the report itself
};

export const reportService = createReportService({
  repository: reportsRepository,
  files: fileStorage,
  newId: uuidv4,
  now: () => new Date().toISOString(),
  background: {
    kick: () => runInBackground(imagePreparer.run()),
    pause: () => imagePreparer.pause(),
    resume: () => imagePreparer.resume(),
  },
});

export const imagePreparer = createImagePreparer({
  repository: reportsRepository,
  compress: compressImage,
  files: fileStorage,
  folderFor: reportFolder,
  onChange: () => reportService.refresh(),
});

/**
 * Startup: open + migrate the database and load the local reports (the
 * first screen waits for this), then resume any unfinished compression in
 * the background (the screen does not wait for that).
 */
export const initializeLocalData = async () => {
  await initDatabase();
  await reportService.refresh();
  runInBackground(imagePreparer.run());
};
