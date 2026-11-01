import { ImageTooLargeError } from './compressionLadder';

import type { ImageCompressor } from './imageCompressor';
import type { Report, ReportStatus } from '@app-types';
import type { ReportsRepository } from '@db';
import type { FileStorage } from '@services/files/fileStorage';

export type ImagePreparerDeps = {
  repository: ReportsRepository;
  compress: ImageCompressor;
  files: Pick<FileStorage, 'keepUploadFile'>;
  /** Folder for a report's files (compressed output goes there first). */
  folderFor: (reportId: string) => string;
  /** Called after every database change so the screens refresh. */
  onChange: () => Promise<void>;
};

/** Reports that may still need compressing (not failed, not uploaded). */
const PREPARABLE: readonly ReportStatus[] = [
  'queued',
  'waitingNet',
  'compressing',
];

export const needsPreparation = (report: Report) =>
  PREPARABLE.includes(report.status) &&
  report.images.some(image => image.status === 'pending');

const failureMessage = (error: unknown) =>
  error instanceof ImageTooLargeError
    ? "A photo couldn't be made smaller than 5 MB."
    : "A photo couldn't be prepared for upload. It may be missing from this phone.";

/**
 * Shrinks every photo of every saved report under 5 MB, before any upload.
 * It needs no network, so it runs as soon as a report is saved, even
 * offline: when the signal comes back, uploading can start immediately.
 *
 * Crash-safe by design: each photo's result is written to the database
 * right after it is produced, and the report stays `compressing` until all
 * are done. After a force-quit, the next run sees `compressing` + photos
 * still `pending` and continues from the first unfinished photo.
 *
 * Single-flight: `run()` while a run is going returns that same run, so two
 * triggers (startup + save) never compress the same photo twice at once.
 * One photo at a time, to keep memory bounded (an 18 MB JPEG decodes to
 * ~48 MB of pixels).
 */
export const createImagePreparer = ({
  repository,
  compress,
  files,
  folderFor,
  onChange,
}: ImagePreparerDeps) => {
  let current: Promise<void> | null = null;
  let paused = false;

  const prepareReport = async (report: Report) => {
    await repository.update(report.id, { status: 'compressing' });
    await onChange();

    const pending = report.images
      .filter(image => image.status === 'pending')
      .sort((a, b) => a.position - b.position);

    for (const image of pending) {
      if (paused) {
        return; // stays `compressing`; the next run resumes here
      }
      if (!image.originalPath) {
        throw new Error('Original photo path is missing');
      }
      const result = await compress(image.originalPath, folderFor(report.id));
      const uploadPath = await files.keepUploadFile(
        result.path,
        report.id,
        image.position,
      );
      await repository.updateImage(image.id, {
        status: 'compressed',
        compressedPath: uploadPath,
        sizeBytes: result.sizeBytes,
        width: result.width,
        height: result.height,
      });
      await onChange();
    }

    await repository.update(report.id, { status: 'queued' });
    await onChange();
  };

  const runOnce = async () => {
    // Loop, so reports saved while this run was busy are picked up too.
    for (;;) {
      if (paused) {
        return;
      }
      const next = (await repository.list())
        .filter(needsPreparation)
        // Oldest first: the order they will upload in.
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!next) {
        return;
      }
      try {
        await prepareReport(next);
      } catch (error) {
        // Retrying the same broken file would fail the same way: stop and
        // tell the user (the report and its original photos stay saved).
        await repository.update(next.id, {
          status: 'failed',
          failureKind: 'permanent',
          lastError: failureMessage(error),
        });
        await onChange();
      }
    }
  };

  const run = (): Promise<void> => {
    if (!current) {
      current = runOnce().finally(() => {
        current = null;
      });
    }
    return current;
  };

  return {
    run,
    /** Stops after the photo in progress and waits (used by Start over). */
    async pause() {
      paused = true;
      await current;
    },
    resume() {
      paused = false;
    },
  };
};

export type ImagePreparer = ReturnType<typeof createImagePreparer>;
