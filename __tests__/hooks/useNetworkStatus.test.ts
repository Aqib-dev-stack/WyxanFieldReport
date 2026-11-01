import { toNetworkStatus } from '@hooks/useNetworkStatus';

describe('toNetworkStatus', () => {
  it('is unknown before NetInfo has answered', () => {
    expect(
      toNetworkStatus({ isConnected: null, isInternetReachable: null }),
    ).toBe('unknown');
  });

  it('is offline with no network interface', () => {
    expect(
      toNetworkStatus({ isConnected: false, isInternetReachable: null }),
    ).toBe('offline');
  });

  it('is offline when connected but the internet is unreachable', () => {
    expect(
      toNetworkStatus({ isConnected: true, isInternetReachable: false }),
    ).toBe('offline');
  });

  it('is online while the reachability probe is still running', () => {
    expect(
      toNetworkStatus({ isConnected: true, isInternetReachable: null }),
    ).toBe('online');
  });

  it('is online when connected and reachable', () => {
    expect(
      toNetworkStatus({ isConnected: true, isInternetReachable: true }),
    ).toBe('online');
  });
});
