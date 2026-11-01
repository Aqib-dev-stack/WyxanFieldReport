import { backoffDelay, decideOnFailure } from './retryPolicy';

import type { ReportsApi } from '../api/reportsApi';
import type {
  ApiError,
  Report,
  ReportStatus,
  UploadProgress,
} from '@app-types';
import type { ReportsRepository } from '@db';

export type UploadEngineDeps = {
  repository: ReportsRepository;
  api: ReportsApi;
  files: {
    /** Size in bytes, or null if the file is missing. */
    sizeOf: (path: string) => Promise<number | null>;
    sha256: (path: string) => Promise<string>;
  };
  maxImageBytes: number;
  /** Clock and timers are injected so tests control time. */
  now: () => number;
  random?: () => number;
  setTimer: (callback: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  /** Called after every database change so the screens refresh. */
  onChange: () => Promise<void>;
};

/** Reports the engine may pick up (photos must already be compressed). */
const UPLOADABLE: readonly ReportStatus[] = [
  'queued',
  'waitingNet',
  'uploading',
  'committing',
];

const isUploadable = (report: Report) =>
  UPLOADABLE.includes(report.status) &&
  report.images.length > 0 &&
  report.images.every(
    image => image.status === 'compressed' || image.status === 'uploaded',
  );

const dueTime = (report: Report) =>
  report.nextAttemptAt ? Date.parse(report.nextAttemptAt) : 0;

/** A local problem with a photo file: retrying won't fix it. */
class LocalFileProblem extends Error {}

type Outcome =
  /** Report finished (uploaded or failed for good): move to the next one. */
  | 'next'
  /** Temporary failure, or paused: stop this run; a wake-up is scheduled. */
  | 'stop';

/**
 * Gets every saved report to the server, unattended.
 *
 * Per report: upload each photo (PUT, idempotent by report id + slot),
 * then commit (idempotent by report id). Every step is written to the
 * database before the next one starts, so after a force-quit the next run
 * continues exactly where it stopped: photos already `uploaded` are
 * skipped, the photo in flight is simply sent again (same slot, overwritten),
 * and a commit whose answer was lost is repeated (the server answers 200
 * with the report it already has). Nothing lands twice.
 *
 * Failures go through one policy (retryPolicy.ts): temporary ones are
 * retried with exponential backoff + jitter, permanent ones mark the report
 * `failed` with a reason and the engine moves on to the next report.
 *
 * Single-flight: `run()` while running returns the same run. No React: it is
 * driven by triggers (app start, after saving, network back, foreground)
 * and by its own timer for the next retry.
 */
export const createUploadEngine = ({
  repository,
  api,
  files,
  maxImageBytes,
  now,
  random = Math.random,
  setTimer,
  clearTimer,
  onChange,
}: UploadEngineDeps) => {
  let current: Promise<void> | null = null;
  let paused = false;
  let inFlight: AbortController | null = null;
  let wakeTimer: unknown = null;

  // Live progress of the report being uploaded (memory only: bytes move too
  // often to write each one to the database, and it's meaningless after a
  // restart anyway).
  let progress: Readonly<Record<string, UploadProgress>> = {};
  const progressListeners = new Set<() => void>();
  const setProgress = (reportId: string, value: UploadProgress | null) => {
    const next = { ...progress };
    if (value) {
      next[reportId] = value;
    } else {
      delete next[reportId];
    }
    progress = next;
    progressListeners.forEach(listener => listener());
  };

  const scheduleWake = (reports: Report[]) => {
    if (wakeTimer !== null) {
      clearTimer(wakeTimer);
      wakeTimer = null;
    }
    const nowMs = now();
    const nextDue = reports
      .filter(isUploadable)
      .map(dueTime)
      .filter(time => time > nowMs)
      .sort((a, b) => a - b)[0];
    if (nextDue !== undefined && !paused) {
      wakeTimer = setTimer(() => {
        wakeTimer = null;
        run().catch(() => undefined);
      }, nextDue - nowMs);
    }
  };

  const handleFailure = async (
    report: Report,
    error: ApiError,
  ): Promise<Outcome> => {
    setProgress(report.id, null);
    // Aborted on purpose (pause / Start over): leave the state as it is.
    if (paused) {
      return 'stop';
    }
    const decision = decideOnFailure(error);
    if (decision.kind === 'fail') {
      await repository.update(report.id, {
        status: 'failed',
        failureKind: 'permanent',
        lastError: decision.message,
        nextAttemptAt: null,
      });
      await onChange();
      return 'next';
    }
    const attemptCount = report.attemptCount + 1;
    await repository.update(report.id, {
      status: decision.waitingForNetwork ? 'waitingNet' : 'queued',
      failureKind: 'retryable',
      lastError: decision.message,
      attemptCount,
      nextAttemptAt: new Date(
        now() + backoffDelay(attemptCount, random),
      ).toISOString(),
    });
    await onChange();
    // The link or the server is the problem, not this report: don't hammer
    // the next one too. Stop, and wake up when the backoff is over.
    return 'stop';
  };

  const uploadReport = async (report: Report): Promise<Outcome> => {
    const controller = new AbortController();
    inFlight = controller;
    const images = [...report.images].sort((a, b) => a.position - b.position);
    const total = images.length;
    let uploaded = images.filter(image => image.status === 'uploaded').length;

    try {
      if (report.status !== 'committing' || uploaded < total) {
        await repository.update(report.id, { status: 'uploading' });
        setProgress(report.id, {
          uploadedPhotos: uploaded,
          totalPhotos: total,
          fraction: uploaded / total,
        });
        await onChange();
      }

      for (const image of images) {
        if (image.status === 'uploaded') {
          continue;
        }
        if (paused) {
          return 'stop';
        }
        // Defense in depth: never send anything over the limit, whatever
        // the earlier steps did.
        const size = image.uploadPath
          ? await files.sizeOf(image.uploadPath)
          : null;
        if (!image.uploadPath || size === null) {
          throw new LocalFileProblem(
            'A photo is missing on this phone. Remove the report and create it again.',
          );
        }
        if (size > maxImageBytes) {
          throw new LocalFileProblem('A photo is over 5 MB and was not sent.');
        }

        const done = uploaded;
        const result = await api.uploadImage({
          reportId: report.id,
          position: image.position,
          filePath: image.uploadPath,
          sha256: await files.sha256(image.uploadPath),
          signal: controller.signal,
          onProgress: fraction =>
            setProgress(report.id, {
              uploadedPhotos: done,
              totalPhotos: total,
              fraction: (done + fraction) / total,
            }),
        });
        if (!result.ok) {
          return handleFailure(report, result.error);
        }
        await repository.updateImage(image.id, { status: 'uploaded' });
        uploaded += 1;
        setProgress(report.id, {
          uploadedPhotos: uploaded,
          totalPhotos: total,
          fraction: uploaded / total,
        });
        await onChange();
      }

      if (paused) {
        return 'stop';
      }
      await repository.update(report.id, { status: 'committing' });
      setProgress(report.id, null);
      await onChange();

      const commit = await api.commitReport(
        {
          id: report.id,
          description: report.description,
          imageCount: total,
          createdAt: report.createdAt,
        },
        controller.signal,
      );
      if (!commit.ok) {
        // The server is missing photos (e.g. its disk was wiped): mark just
        // those for re-upload and retry, instead of failing the report.
        if (commit.error.code === 'missingImages' && commit.error.missing) {
          for (const image of images) {
            if (commit.error.missing.includes(image.position)) {
              await repository.updateImage(image.id, { status: 'compressed' });
            }
          }
          return handleFailure(report, { kind: 'server', status: 409 });
        }
        return handleFailure(report, commit.error);
      }

      await repository.update(report.id, {
        status: 'uploaded',
        attemptCount: report.attemptCount + 1,
        failureKind: null,
        lastError: null,
        nextAttemptAt: null,
      });
      await onChange();
      return 'next';
    } catch (error) {
      setProgress(report.id, null);
      if (error instanceof LocalFileProblem) {
        await repository.update(report.id, {
          status: 'failed',
          failureKind: 'permanent',
          lastError: error.message,
          nextAttemptAt: null,
        });
        await onChange();
        return 'next';
      }
      // Unexpected (e.g. reading the file failed): treat as temporary, with
      // backoff, rather than losing the report or spinning.
      return handleFailure(report, { kind: 'server' });
    } finally {
      inFlight = null;
    }
  };

  const runOnce = async () => {
    for (;;) {
      if (paused) {
        return;
      }
      const reports = await repository.list();
      const nowMs = now();
      const next = reports
        .filter(isUploadable)
        .filter(report => dueTime(report) <= nowMs)
        // Oldest first: reports reach the server in the order they were made.
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!next) {
        scheduleWake(reports);
        return;
      }
      if ((await uploadReport(next)) === 'stop') {
        scheduleWake(await repository.list());
        return;
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

    /**
     * Skip the backoff wait for reports waiting on the network and try now
     * (used when the network comes back).
     */
    async retryWaitingNow() {
      const reports = await repository.list();
      for (const report of reports) {
        if (report.status === 'waitingNet' && report.nextAttemptAt) {
          await repository.update(report.id, { nextAttemptAt: null });
        }
      }
      await onChange();
      return run();
    },

    /** Stops after aborting the request in flight, and waits (Start over). */
    async pause() {
      paused = true;
      inFlight?.abort();
      if (wakeTimer !== null) {
        clearTimer(wakeTimer);
        wakeTimer = null;
      }
      await current;
      progress = {};
      progressListeners.forEach(listener => listener());
    },

    resume() {
      paused = false;
    },

    /** Live byte progress per report id (for the Outbox). */
    getProgress: (): Readonly<Record<string, UploadProgress>> => progress,
    subscribeProgress(listener: () => void) {
      progressListeners.add(listener);
      return () => {
        progressListeners.delete(listener);
      };
    },
  };
};

export type UploadEngine = ReturnType<typeof createUploadEngine>;
