import { useCallback, useMemo } from 'react';

import { reportService } from '@services';

import { useOutboxReports } from './useOutboxReports';

import type { OutboxItem } from '@app-types';

/**
 * One local report, kept live (status and progress update while open).
 * `null` when it no longer exists on the phone, e.g. after Start over.
 * `retry` puts a failed report back in the queue.
 */
export const useReportDetail = (
  reportId: string,
): { item: OutboxItem | null; retry: () => void } => {
  const items = useOutboxReports();
  const item = useMemo(
    () => items.find(candidate => candidate.report.id === reportId) ?? null,
    [items, reportId],
  );
  const retry = useCallback(() => {
    reportService.retryReport(reportId).catch(() => undefined);
  }, [reportId]);
  return { item, retry };
};
