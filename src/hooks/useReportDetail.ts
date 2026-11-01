import { useCallback, useMemo } from 'react';

import { useOutboxReports } from './useOutboxReports';

import type { OutboxItem } from '@app-types';

/**
 * One local report, kept live (status and progress update while open).
 * `null` when it no longer exists on the phone, e.g. after Start over.
 *
 * UI phase: `retry` is a no-op. Phase 8 wires it to the upload engine, which
 * resets the report to `queued` and wakes the runner.
 */
export const useReportDetail = (
  reportId: string,
): { item: OutboxItem | null; retry: () => void } => {
  const items = useOutboxReports();
  const item = useMemo(
    () => items.find(candidate => candidate.report.id === reportId) ?? null,
    [items, reportId],
  );
  const retry = useCallback(() => undefined, []);
  return { item, retry };
};
