import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { hasCameraPermission } from '@services/media/cameraPermission';
import { pickPhotos } from '@services/media/photoPicker';

import type { DraftPhoto, PhotoSource } from '@app-types';

export type PermissionProblem = {
  source: PhotoSource;
  /** denied: may ask again. blocked: only Settings can fix it. */
  state: 'denied' | 'blocked';
};

/**
 * Picking photos plus the permission and error states that come with it.
 * Knows nothing about the form: it returns the photos and the caller adds
 * them.
 *
 * When the app comes back to the foreground (e.g. from Settings), the camera
 * permission is checked again and the notice disappears if it was granted:
 * no restart needed.
 */
export const usePhotoPicker = ({
  onError,
}: {
  onError: (message: string) => void;
}) => {
  const [problem, setProblem] = useState<PermissionProblem | null>(null);

  const pick = useCallback(
    async (source: PhotoSource, limit: number): Promise<DraftPhoto[]> => {
      const result = await pickPhotos(source, limit);
      switch (result.kind) {
        case 'picked':
          setProblem(null);
          return result.photos;
        case 'denied':
        case 'blocked':
          setProblem({ source: result.source, state: result.kind });
          return [];
        case 'error':
          onError(result.message);
          return [];
        case 'cancelled':
          return [];
      }
    },
    [onError],
  );

  useEffect(() => {
    if (problem?.source !== 'camera') {
      return;
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        return;
      }
      hasCameraPermission()
        .then(granted => granted && setProblem(null))
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, [problem]);

  const dismissProblem = useCallback(() => setProblem(null), []);

  /** Opens this app's page in system Settings. */
  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  return { pick, problem, dismissProblem, openSettings };
};
