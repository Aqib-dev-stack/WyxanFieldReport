/**
 * Where the backend is. `localhost` works on a USB-connected phone or an
 * emulator after `adb reverse tcp:4000 tcp:4000`. Plain HTTP is allowed in
 * debug builds only (Android's usesCleartextTraffic).
 */
export const API_BASE_URL = 'http://localhost:4000';

export const API_TIMEOUTS = {
  /** Small JSON requests (commit, list). */
  requestMs: 30_000,
  /**
   * Uploads have no total time limit (a 5 MB photo on 2G can take minutes:
   * slow is fine). They are cut only when NO bytes move for this long, or
   * when the server goes silent this long after the last byte.
   */
  uploadStallMs: 45_000,
} as const;
