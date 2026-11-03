import { createUploadTriggers } from '@services/triggers/uploadTriggers';

import type { AppStateValue } from '@services/triggers/uploadTriggers';
import type { NetworkStatus } from '@utils/network';

const setup = () => {
  let network: (status: NetworkStatus) => void = () => undefined;
  let appState: (state: AppStateValue) => void = () => undefined;
  const onNetworkBack = jest.fn();
  const onForeground = jest.fn();
  const unsubscribed = jest.fn();

  const triggers = createUploadTriggers({
    subscribeNetwork: listener => {
      network = listener;
      return unsubscribed;
    },
    subscribeAppState: listener => {
      appState = listener;
      return unsubscribed;
    },
    onNetworkBack,
    onForeground,
  });
  triggers.start();

  return {
    triggers,
    network: (status: NetworkStatus) => network(status),
    appState: (state: AppStateValue) => appState(state),
    onNetworkBack,
    onForeground,
    unsubscribed,
  };
};

describe('uploadTriggers', () => {
  it('fires when the network comes back, not on the first answer or while online', () => {
    const t = setup();
    t.network('online'); // first NetInfo answer at startup
    t.network('online');
    expect(t.onNetworkBack).not.toHaveBeenCalled();

    t.network('offline'); // airplane mode on
    t.network('online'); // and off again
    expect(t.onNetworkBack).toHaveBeenCalledTimes(1);
  });

  it('ignores "unknown" in between', () => {
    const t = setup();
    t.network('offline');
    t.network('unknown');
    t.network('online');
    expect(t.onNetworkBack).not.toHaveBeenCalled();
  });

  it('fires when the app returns to the foreground', () => {
    const t = setup();
    t.appState('active');
    expect(t.onForeground).not.toHaveBeenCalled();

    t.appState('background');
    t.appState('active');
    expect(t.onForeground).toHaveBeenCalledTimes(1);
  });

  it('starts once and stops cleanly', () => {
    const t = setup();
    t.triggers.start(); // second start is a no-op
    t.triggers.stop();
    expect(t.unsubscribed).toHaveBeenCalledTimes(2);
  });
});
