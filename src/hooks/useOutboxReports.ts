import { useMemo, useSyncExternalStore } from 'react';

import { reportService } from '@services/reports';

import type { OutboxItem } from '@app-types';

/**
 * Reports saved on this phone, read from the local database (through the
 * report service's snapshot, so there is no loading flash: the list is
 * loaded before the first screen renders). Upload progress joins in phase 8.
 */
export const useOutboxReports = (): OutboxItem[] => {
  const reports = useSyncExternalStore(
    reportService.subscribe,
    reportService.getSnapshot,
  );
  return useMemo(
    () => reports.map(report => ({ report, progress: null })),
    [reports],
  );
};
