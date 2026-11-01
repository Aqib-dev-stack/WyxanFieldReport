import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { uuidv4 } from '@utils/uuid';

import { requestCameraPermission } from './cameraPermission';

import type { PhotoSource, PickResult } from '@app-types';
import type { ImagePickerResponse } from 'react-native-image-picker';

/**
 * Turns the picker's response into our `PickResult`. Pure, so it is unit
 * tested. Never returns more than `limit` photos, whatever the picker sent.
 */
export const toPickResult = (
  response: ImagePickerResponse,
  limit: number,
  newId: () => string = uuidv4,
): PickResult => {
  if (response.didCancel) {
    return { kind: 'cancelled' };
  }
  if (response.errorCode === 'permission') {
    return { kind: 'blocked', source: 'camera' };
  }
  if (response.errorCode === 'camera_unavailable') {
    return { kind: 'error', message: 'This device has no camera available.' };
  }
  if (response.errorCode) {
    return { kind: 'error', message: "Couldn't add the photo. Try again." };
  }
  const photos = (response.assets ?? [])
    .filter(asset => typeof asset.uri === 'string')
    .slice(0, Math.max(0, limit))
    .map(asset => ({
      id: newId(),
      uri: asset.uri as string,
      width: asset.width ?? null,
      height: asset.height ?? null,
      sizeBytes: asset.fileSize ?? null,
    }));
  return photos.length > 0 ? { kind: 'picked', photos } : { kind: 'cancelled' };
};

/**
 * Opens the camera or gallery for up to `limit` photos.
 *
 * Originals are kept as they are (quality 1, no resize): shrinking under
 * 5 MB is a separate step (phase 4) that runs off the UI thread. The picker
 * hands back its own temporary copy; the report service copies it into the
 * app's storage before saving, because the OS may clear that temp folder.
 */
export const pickPhotos = async (
  source: PhotoSource,
  limit: number,
): Promise<PickResult> => {
  if (limit <= 0) {
    return { kind: 'cancelled' };
  }
  if (source === 'camera') {
    const permission = await requestCameraPermission();
    if (permission !== 'granted') {
      return { kind: permission, source };
    }
    return toPickResult(
      await launchCamera({
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: false,
      }),
      limit,
    );
  }
  return toPickResult(
    await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: limit,
    }),
    limit,
  );
};
