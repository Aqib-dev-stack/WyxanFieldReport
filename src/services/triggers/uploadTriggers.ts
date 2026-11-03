import type { NetworkStatus } from '@utils/network';

export type AppStateValue = 'active' | 'background' | 'inactive' | string;

export type UploadTriggersDeps = {
  /** Calls back with every network change; returns an unsubscribe. */
  subscribeNetwork: (listener: (status: NetworkStatus) => void) => () => void;
  /** Calls back with every app-state change; returns an unsubscribe. */
  subscribeAppState: (listener: (state: AppStateValue) => void) => () => void;
  /** The network came back after being offline. */
  onNetworkBack: () => void;
  /** The app came back to the foreground. */
  onForeground: () => void;
};

/**
 * When to wake the upload pipeline besides app start and saving:
 *
 * - network back: offline → online. Reports waiting for the network go
 *   right away instead of waiting out their backoff timer.
 * - app foreground: background → active. Android may have suspended the
 *   app (pocket, Doze); whatever was waiting resumes the moment the
 *   inspector looks at the phone.
 *
 * Only transitions count: "online → online" or the very first NetInfo
 * answer at startup do nothing (startup has its own kick). Pure logic with
 * injected subscriptions, so it is unit tested without NetInfo or AppState.
 */
export const createUploadTriggers = ({
  subscribeNetwork,
  subscribeAppState,
  onNetworkBack,
  onForeground,
}: UploadTriggersDeps) => {
  let stops: (() => void)[] = [];
  let lastNetwork: NetworkStatus = 'unknown';
  let lastAppState: AppStateValue = 'active';

  return {
    start() {
      if (stops.length > 0) {
        return; // already listening
      }
      stops = [
        subscribeNetwork(status => {
          if (lastNetwork === 'offline' && status === 'online') {
            onNetworkBack();
          }
          lastNetwork = status;
        }),
        subscribeAppState(state => {
          if (lastAppState !== 'active' && state === 'active') {
            onForeground();
          }
          lastAppState = state;
        }),
      ];
    },
    stop() {
      stops.forEach(stop => stop());
      stops = [];
    },
  };
};
