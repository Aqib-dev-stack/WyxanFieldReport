import { useSyncExternalStore } from 'react';

import { getMockOutbox, subscribeMockOutbox } from '@mocks';

import type { OutboxItem } from '@app-types';

/**
 * Reports saved on this phone, with live upload progress.
 *
 * UI phase: reads the in-memory mock store. Phase 8 swaps the source for the
 * local database and the upload engine's progress, keeping this signature,
 * so the Outbox screen doesn't change.
 */
export const useOutboxReports = (): OutboxItem[] =>
  useSyncExternalStore(subscribeMockOutbox, getMockOutbox);
