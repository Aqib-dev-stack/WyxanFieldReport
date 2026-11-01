import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { mockPickPhotos } from '@mocks';

import type { DraftPhoto, PhotoSource } from '@app-types';

/**
 * Picking photos and the "permission blocked" state that comes with it.
 * Knows nothing about the form: it returns the photos and the caller adds
 * them. UI phase: uses the mock picker; phase 3 swaps in the real one.
 */
export const usePhotoPicker = () => {
  const [blockedSource, setBlockedSource] = useState<PhotoSource | null>(null);

  const pick = useCallback(
    async (source: PhotoSource, limit: number): Promise<DraftPhoto[]> => {
      const result = await mockPickPhotos(source, limit);
      if (result.kind === 'blocked') {
        setBlockedSource(result.source);
        return [];
      }
      setBlockedSource(null);
      return result.kind === 'picked' ? result.photos : [];
    },
    [],
  );

  const dismissBlocked = useCallback(() => setBlockedSource(null), []);

  /** Opens this app's page in system Settings (real, not mocked). */
  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  return { pick, blockedSource, dismissBlocked, openSettings };
};
