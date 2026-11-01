import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mockFetchServerReports } from '@mocks';
import { applyFetchResult } from '@utils/serverReports';

import { useNetworkStatus } from './useNetworkStatus';

import type { ServerReportsState } from '@utils/serverReports';

/**
 * load     no list yet: show the skeleton
 * refresh  pull-to-refresh: show the refresh spinner over the list
 * silent   tab re-opened with a list: update quietly in the background
 */
type FetchMode = 'load' | 'refresh' | 'silent';

/**
 * Reports the SERVER holds, fetched from the server every time the tab is
 * opened (never read from local state). Also retries by itself when the
 * network comes back after a failed load.
 *
 * UI phase: calls the mock API. Phase 8 swaps in the real API client with
 * the same `ApiResult` shape.
 */
export const useServerReports = () => {
  const [state, setState] = useState<ServerReportsState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const network = useNetworkStatus();

  // Refs, so callbacks stay stable and late answers can be ignored.
  const stateRef = useRef(state);
  stateRef.current = state;
  const latestRequest = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchReports = useCallback(async (mode: FetchMode) => {
    const requestId = ++latestRequest.current;
    if (mode === 'load') {
      setState({ status: 'loading' });
    } else if (mode === 'refresh') {
      setIsRefreshing(true);
    }

    const result = await mockFetchServerReports();

    // Only the newest request may update the screen.
    if (!mounted.current || requestId !== latestRequest.current) {
      return;
    }
    setState(prev => applyFetchResult(prev, result, new Date().toISOString()));
    setIsRefreshing(false);
  }, []);

  const run = useCallback(
    (mode: FetchMode) => {
      fetchReports(mode).catch(() => undefined);
    },
    [fetchReports],
  );

  // Every time the tab gains focus: full load the first time, quiet update after.
  useFocusEffect(
    useCallback(() => {
      run(stateRef.current.status === 'success' ? 'silent' : 'load');
    }, [run]),
  );

  // Back online after a failed load: try again without waiting for the user.
  const previousNetwork = useRef(network);
  useEffect(() => {
    const cameBack =
      previousNetwork.current === 'offline' && network === 'online';
    previousNetwork.current = network;
    if (cameBack && stateRef.current.status === 'error') {
      run('load');
    }
  }, [network, run]);

  const refresh = useCallback(() => run('refresh'), [run]);
  const retry = useCallback(
    () => run(stateRef.current.status === 'success' ? 'refresh' : 'load'),
    [run],
  );

  /** Full reload with the skeleton (used by the dev scenario switcher). */
  const reload = useCallback(() => run('load'), [run]);

  return { state, isRefreshing, refresh, retry, reload };
};
