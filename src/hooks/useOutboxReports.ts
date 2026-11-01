import { useMemo, useSyncExternalStore } from 'react';

import { reportService, uploadEngine } from '@services';

import type { OutboxItem } from '@app-types';

/**
 * Reports saved on this phone, read from the local database (the report
 * service's snapshot, loaded before the first screen renders, so there is no
 * loading flash), joined with the upload engine's live byte progress.
 */
export const useOutboxReports = (): OutboxItem[] => {
  const reports = useSyncExternalStore(
    reportService.subscribe,
    reportService.getSnapshot,
  );
  const progress = useSyncExternalStore(
    uploadEngine.subscribeProgress,
    uploadEngine.getProgress,
  );
  return useMemo(
    () =>
      reports.map(report => ({
        report,
        progress:
          report.status === 'uploading' ? progress[report.id] ?? null : null,
      })),
    [reports, progress],
  );
};
