import { MOCK_OUTBOX_ITEMS } from './reports';
import { OUTBOX_SCENARIO } from './scenarios';

import type { DraftPhoto, OutboxItem, Report } from '@app-types';

/**
 * In-memory stand-in for the local database, so a report saved from Compose
 * shows up in the Outbox during the UI phase. Same subscribe/snapshot shape
 * that `useSyncExternalStore` expects. Lost on reload; that's fine for mocks.
 */

let items: OutboxItem[] = OUTBOX_SCENARIO === 'empty' ? [] : MOCK_OUTBOX_ITEMS;
const listeners = new Set<() => void>();

export const subscribeMockOutbox = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getMockOutbox = (): OutboxItem[] => items;

export const addMockReport = ({
  description,
  photos,
}: {
  description: string;
  photos: DraftPhoto[];
}): Report => {
  const id = `local-${Date.now()}`;
  const now = new Date().toISOString();
  const report: Report = {
    id,
    description,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
    nextAttemptAt: null,
    lastError: null,
    failureKind: null,
    images: photos.map((photo, position) => ({
      id: `${id}-img-${position}`,
      reportId: id,
      position,
      localUri: photo.uri,
      sizeBytes: null,
      width: null,
      height: null,
      status: 'pending',
    })),
  };
  // New array, so subscribers see a changed snapshot.
  items = [{ report, progress: null }, ...items];
  listeners.forEach(listener => listener());
  return report;
};

/** UI-phase "Start over": empties the local store. The mock server is untouched. */
export const resetMockOutbox = () => {
  items = [];
  listeners.forEach(listener => listener());
};
