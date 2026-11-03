import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * `unknown` covers the moment before NetInfo's first answer. The UI shows
 * nothing in that case rather than guessing "online" or "offline".
 */
export type NetworkStatus = 'online' | 'offline' | 'unknown';

/**
 * Turns NetInfo's state into one fact.
 *
 * - `isConnected` says whether there is a network interface (Wi-Fi, cellular).
 * - `isInternetReachable` says whether NetInfo's probe actually reached the
 *   internet. It is `null` until the probe finishes. Being connected with a
 *   `null` probe counts as online; a `false` probe (captive portal, dead
 *   cellular link) counts as offline.
 *
 * Used for display and as a CUE to retry uploads. The upload engine never
 * gates on it: it tries the request and judges by the result, because
 * NetInfo can be wrong (e.g. "online" on a link that drops every packet).
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
