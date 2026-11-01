import { MOCK_PERMISSIONS } from './scenarios';

import type { PhotoSource, PickResult } from '@app-types';

let counter = 0;

/**
 * Stand-in for the real camera / gallery picker (phase 3). Same contract:
 * resolves with the picked photos, `cancelled`, or `blocked` when the OS
 * permission is denied. Adds one placeholder photo per pick.
 */
export const mockPickPhotos = async (
  source: PhotoSource,
  limit: number,
): Promise<PickResult> => {
  if (MOCK_PERMISSIONS[source] === 'blocked') {
    return { kind: 'blocked', source };
  }
  if (limit <= 0) {
    return { kind: 'cancelled' };
  }
  counter += 1;
  return {
    kind: 'picked',
    photos: [{ id: `draft-photo-${Date.now()}-${counter}`, uri: null }],
  };
};
