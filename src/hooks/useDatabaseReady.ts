import { useCallback, useEffect, useState } from 'react';

import { initializeLocalData } from '@services/reports';

export type DatabaseStatus = 'opening' | 'ready' | 'failed';

/**
 * Opens the database, applies migrations and loads the local reports once at
 * startup. `retry` runs it again after a failure (migrations are
 * transactional, so a failed one left nothing half-applied).
 */
export const useDatabaseReady = () => {
  const [status, setStatus] = useState<DatabaseStatus>('opening');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('opening');
    initializeLocalData()
      .then(() => active && setStatus('ready'))
      .catch(() => active && setStatus('failed'));
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt(n => n + 1), []);

  return { status, retry };
};
