import { isDraftValid, validateReportDraft } from '@utils/validation';

import type { DraftPhoto, Report } from '@app-types';
import type { ReportsRepository } from '@db';
import type { FileStorage } from '@services/files/fileStorage';

export type ReportServiceDeps = {
  repository: ReportsRepository;
  files: FileStorage;
  newId: () => string;
  now: () => string;
  /**
   * Background work on saved reports (photo compression now, uploads
   * later). Started after a save; paused around Start over so nothing
   * writes into a folder that is being deleted.
   */
  background?: {
    kick: () => void;
    pause: () => Promise<void>;
    resume: () => void;
  };
};

const NO_BACKGROUND = {
  kick: () => undefined,
  pause: async () => undefined,
  resume: () => undefined,
};

export class InvalidReportError extends Error {}

/**
 * Everything the app does with local reports, independent of React.
 *
 * It also keeps an in-memory snapshot of the list for the screens
 * (`subscribe` / `getSnapshot`, the useSyncExternalStore contract). The
 * snapshot is reloaded from the database after every write, so the database
 * stays the single source of truth.
 */
export const createReportService = ({
  repository,
  files,
  newId,
  now,
  background = NO_BACKGROUND,
}: ReportServiceDeps) => {
  let snapshot: Report[] = [];
  const listeners = new Set<() => void>();

  const discardPickedPhotos = async (photos: DraftPhoto[]) => {
    for (const photo of photos) {
      await files.deletePickerCopy(photo.uri).catch(() => undefined);
    }
  };

  const refresh = async () => {
    snapshot = await repository.list();
    listeners.forEach(listener => listener());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: (): Report[] => snapshot,

    /** Loads the list from the database (at startup, after migrations). */
    refresh,

    /**
     * Saves a new report on the phone. Order matters:
     * 1. copy each photo into the app's storage (the picker's temp copy can
     *    vanish), 2. write the report + photo rows in one transaction.
     * Files first, so a saved row never points at a missing file. If any
     * step fails, the copies are removed and nothing is saved.
     */
    async createReport(draft: {
      description: string;
      photos: DraftPhoto[];
    }): Promise<string> {
      const errors = validateReportDraft({
        description: draft.description,
        photoCount: draft.photos.length,
      });
      if (!isDraftValid(errors)) {
        throw new InvalidReportError('Report is not valid');
      }

      const id = newId();
      try {
        const images = [];
        for (const [position, photo] of draft.photos.entries()) {
          images.push({
            id: newId(),
            position,
            originalUri: photo.uri,
            localPath: await files.copyIntoAppStorage(photo.uri, id, position),
          });
        }
        await repository.create({
          id,
          description: draft.description.trim(),
          createdAt: now(),
          images,
        });
      } catch (error) {
        await files.deleteReportFiles(id).catch(() => undefined);
        throw error;
      }

      // The photos now live in the app's own folder: the picker's
      // temporary copies are no longer needed (best effort).
      await discardPickedPhotos(draft.photos);

      await refresh();
      // Start compressing right away: it needs no network.
      background.kick();
      return id;
    },

    /**
     * Photos removed from the form, or a discarded report: delete the
     * picker's temporary copies (never a gallery original).
     */
    discardPickedPhotos,

    /**
     * Startup sweep, before any screen or background work runs:
     * - report folders with no report in the database (only possible if
     *   the app died in the middle of saving, after copying photos);
     * - the picker's temporary copies (from a draft that was never saved).
     */
    async cleanUpLeftovers(): Promise<void> {
      await files
        .removeOrphanFolders(snapshot.map(report => report.id))
        .catch(() => undefined);
      await files.clearPickerCopies().catch(() => undefined);
    },

    /**
     * Start over. Background work is paused first (the photo being
     * compressed finishes), then database, then files: if the app dies in between,
     * the worst case is unused files (cleaned on the next reset), never a
     * report row whose photos are gone.
     */
    async startOver(): Promise<void> {
      await background.pause();
      try {
        await repository.deleteAll();
        await files.deleteAllReportFiles();
        // Nothing of the old reports may stay behind, not even the picker's
        // temporary copies in the cache.
        await files.clearPickerCopies().catch(() => undefined);
        await refresh();
      } finally {
        background.resume();
      }
    },

    /**
     * "Try again" on a failed report: back into the queue with a clean
     * slate. Photos still `pending` are compressed again first.
     */
    async retryReport(id: string): Promise<void> {
      await repository.update(id, {
        status: 'queued',
        failureKind: null,
        lastError: null,
        nextAttemptAt: null,
      });
      await refresh();
      background.kick();
    },
  };
};

export type ReportService = ReturnType<typeof createReportService>;
