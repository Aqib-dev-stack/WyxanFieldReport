import { PermissionsAndroid, Platform } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'blocked';

const CAMERA = PermissionsAndroid.PERMISSIONS.CAMERA;

/** Current state without prompting (used when the app returns to the foreground). */
export const hasCameraPermission = async (): Promise<boolean> =>
  Platform.OS !== 'android' || PermissionsAndroid.check(CAMERA);

/**
 * Asks for the camera if needed. On Android, after the user refuses (twice
 * on Android 11+), the system stops showing the prompt and reports
 * `never_ask_again`: from then on only Settings can grant it ('blocked').
 * iOS (optional here): the picker shows the system prompt itself.
 */
export const requestCameraPermission = async (): Promise<PermissionState> => {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  if (await PermissionsAndroid.check(CAMERA)) {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(CAMERA);
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ? 'blocked'
    : 'denied';
};
