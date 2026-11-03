import { useNetInfo } from '@react-native-community/netinfo';

import { toNetworkStatus } from '@utils/network';

import type { NetworkStatus } from '@utils/network';

export type { NetworkStatus } from '@utils/network';
export { toNetworkStatus } from '@utils/network';

/** Live network status. Updates whenever NetInfo reports a change. */
export const useNetworkStatus = (): NetworkStatus =>
  toNetworkStatus(useNetInfo());
