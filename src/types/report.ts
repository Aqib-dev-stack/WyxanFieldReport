/**
 * Domain types for reports kept on this phone. They mirror the local database
 * rows planned for the DB phase (`reports`, `report_images`), so screens built
 * on mock data today keep working when the data becomes real.
 */

/**
 * Where a report is in its trip to the server. One source of truth: the DB
 * column, the upload engine and the UI all use this union.
 *
 *   queued       saved on phone, next in line
 *   waitingNet   saved on phone, the last attempt found no network
 *   compressing  shrinking photos under 5 MB
 *   uploading    sending photos one by one
 *   committing   all photos sent; asking the server to finalise the report
 *   uploaded     the server confirmed it holds the complete report
 *   failed       stopped; needs the user (permanent error, e.g. server refused it)
 */
export const REPORT_STATUSES = [
  'queued',
  'waitingNet',
  'compressing',
  'uploading',
  'committing',
  'uploaded',
  'failed',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Retryable errors are retried automatically; permanent ones wait for the user. */
export type FailureKind = 'retryable' | 'permanent';

export type ReportImageStatus =
  | 'pending'
  | 'compressed'
  | 'uploaded'
  | 'failed';

export type ReportImage = {
  id: string;
  reportId: string;
  /** 0–4, the order the user picked. Also the slot on the server. */
  position: number;
  /** The app's own copy of the photo (file:// URI). `null` in mock data. */
  localUri: string | null;
  /** Size of the file that will be sent; `null` until compressed. */
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  status: ReportImageStatus;
};

export type Report = {
  /** Client-generated UUID; also the server key, so retries never duplicate. */
  id: string;
  description: string;
  status: ReportStatus;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  nextAttemptAt: string | null;
  /** User-facing reason for the last failure, if any. */
  lastError: string | null;
  failureKind: FailureKind | null;
  images: ReportImage[];
};

/**
 * Upload progress of one report. Not stored: the upload engine keeps the
 * byte progress of the photo in flight in memory.
 */
export type UploadProgress = {
  uploadedPhotos: number;
  totalPhotos: number;
  /** 0–1 across the whole report, including the photo in flight. */
  fraction: number;
};

/** What the Outbox shows for one report. */
export type OutboxItem = {
  report: Report;
  /** Set only while the report is uploading. */
  progress: UploadProgress | null;
};
