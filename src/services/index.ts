import { REPORT_LIMITS } from '@config';
import { API_BASE_URL } from '@config/api';
import { initDatabase, reportsRepository } from '@db';
import { createReportsApi } from '@services/api/reportsApi';
import { fileStorage, reportFolder } from '@services/files/fileStorage';
import { compressImage } from '@services/images/imageCompressor';
import { createImagePreparer } from '@services/images/imagePreparer';
import { createReportService } from '@services/reports';
import { createUploadEngine } from '@services/upload/uploadEngine';
import { uuidv4 } from '@utils/uuid';

/**
 * Composition root: the only place that builds the services with their real
 * dependencies (database, file system, native compressor, HTTP). Every
 * service takes its dependencies as arguments, so tests build the same
 * services on an in-memory database and fakes. Nothing here imports React.
 */

const runInBackground = (work: Promise<void>) => {
  work.catch(() => undefined); // failures are recorded on the reports themselves
};

export const reportsApi = createReportsApi(API_BASE_URL);

/**
 * Background pipeline for saved reports: compress photos, then upload.
 * Compression needs no network, so it always runs; uploading then tries
 * whatever is ready.
 */
const runPipeline = async () => {
  await imagePreparer.run();
  await uploadEngine.run();
};

export const reportService = createReportService({
  repository: reportsRepository,
  files: fileStorage,
  newId: uuidv4,
  now: () => new Date().toISOString(),
  background: {
    kick: () => runInBackground(runPipeline()),
    pause: async () => {
      await Promise.all([imagePreparer.pause(), uploadEngine.pause()]);
    },
    resume: () => {
      imagePreparer.resume();
      uploadEngine.resume();
    },
  },
});

const refreshScreens = () => reportService.refresh();

export const imagePreparer = createImagePreparer({
  repository: reportsRepository,
  compress: compressImage,
  files: fileStorage,
  folderFor: reportFolder,
  onChange: refreshScreens,
});

export const uploadEngine = createUploadEngine({
  repository: reportsRepository,
  api: reportsApi,
  files: fileStorage,
  maxImageBytes: REPORT_LIMITS.maxImageBytes,
  now: Date.now,
  setTimer: (callback, ms) => setTimeout(callback, ms),
  clearTimer: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  onChange: refreshScreens,
});

/**
 * Startup: open + migrate the database and load the local reports (the
 * first screen waits for this), then resume unfinished compression and
 * uploads in the background (the screen does not wait for that).
 */
export const initializeLocalData = async () => {
  await initDatabase();
  await reportService.refresh();
  runInBackground(runPipeline());
};

/** Kicks the pipeline (used by triggers such as "network is back"). */
export const kickPipeline = () => runInBackground(runPipeline());
