import { useCallback, useMemo, useState } from 'react';

import { resetMockOutbox } from '@mocks';
import { summarizeOutbox } from '@utils/reportStatus';

import { useOutboxReports } from './useOutboxReports';

/**
 * "Start over": what it would delete, and doing it.
 *
 * Reach (documented in README): deletes everything this app stores on the
 * phone (all local reports in any status, the app's photo copies, upload
 * and retry state). Never touches the server or the phone's own gallery.
 *
 * UI phase: clears the mock store. Phase 8 does it for real, in this order:
 * stop the upload runner, delete DB rows in one transaction, delete the
 * app's photo folder.
 */
export const useStartOver = () => {
  const items = useOutboxReports();
  const [isResetting, setIsResetting] = useState(false);

  const counts = useMemo(() => {
    const summary = summarizeOutbox(items);
    return {
      total: items.length,
      /** Not on the server yet: these are lost for good by a reset. */
      unsent: summary.waiting + summary.uploading + summary.failed,
      uploaded: summary.uploaded,
      photos: items.reduce((sum, item) => sum + item.report.images.length, 0),
    };
  }, [items]);

  const startOver = useCallback(async () => {
    setIsResetting(true);
    resetMockOutbox();
    setIsResetting(false);
  }, []);

  return { counts, isResetting, startOver };
};
