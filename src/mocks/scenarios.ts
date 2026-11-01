import type { PhotoSource } from '@app-types';

/**
 * UI-phase switches for previewing states. Deleted with the rest of
 * src/mocks in phase 8.
 */

export type OutboxScenario = 'populated' | 'empty';

/** Set to 'empty' to see the Outbox empty state. */
export const OUTBOX_SCENARIO = 'populated' as OutboxScenario;

/**
 * Mock OS permission per photo source. Camera starts 'blocked' so the
 * "permission denied → Open Settings" state can be seen from "Take photo",
 * while "Choose from gallery" adds photos.
 */
export const MOCK_PERMISSIONS: Record<PhotoSource, 'granted' | 'blocked'> = {
  camera: 'blocked',
  gallery: 'granted',
};
