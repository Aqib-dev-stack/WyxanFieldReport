import { useCallback } from 'react';

import { MOCK_OUTBOX_ITEMS } from '@mocks';
import { reportService } from '@services/reports';

/**
 * Development builds only: writes sample reports in every status into the
 * real database, to preview states the upload engine will produce later.
 */
export const useDevSamples = () =>
  useCallback(
    () => reportService.addSamples(MOCK_OUTBOX_ITEMS.map(item => item.report)),
    [],
  );
