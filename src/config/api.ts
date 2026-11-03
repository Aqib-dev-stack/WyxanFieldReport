/**
 * Where the backend is: this Mac's IP on the same Wi-Fi as the phone, port
 * 4000 (macOS: `ipconfig getifaddr en0`). Change it here when the network,
 * and so the IP, changes. Debug and release builds both use it.
 *
 * Over Wi-Fi, airplane mode on the phone really cuts it off from the server
 * (over a USB cable with `adb reverse` it would not). Plain HTTP is allowed by
 * android/app/src/main/res/xml/network_security_config.xml.
 */
export const API_BASE_URL = 'http://192.168.100.158:4000';

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
