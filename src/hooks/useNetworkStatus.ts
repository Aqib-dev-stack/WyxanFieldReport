import { useNetInfo } from '@react-native-community/netinfo';

import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * `unknown` covers the moment before NetInfo's first answer. The UI shows
 * nothing in that case rather than guessing "online" or "offline".
 */
export type NetworkStatus = 'online' | 'offline' | 'unknown';

/**
 * Turns NetInfo's state into the one fact the header needs.
 *
 * - `isConnected` says whether there is a network interface (Wi-Fi, cellular).
 * - `isInternetReachable` says whether NetInfo's probe actually reached the
 *   internet. It is `null` until the probe finishes. Being connected with a
 *   `null` probe counts as online; a `false` probe (captive portal, dead
 *   cellular link) counts as offline.
 *
 * This value is for display only. The upload engine (later phase) will never
 * gate on it: it will try the request and judge by the result, using network
 * changes only as a cue to try again.
 */
export const toNetworkStatus = (
  state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): NetworkStatus => {
  if (state.isConnected === null) {
    return 'unknown';
  }
  if (!state.isConnected || state.isInternetReachable === false) {
    return 'offline';
  }
  return 'online';
};

/** Live network status. Updates whenever NetInfo reports a change. */
export const useNetworkStatus = (): NetworkStatus =>
  toNetworkStatus(useNetInfo());
