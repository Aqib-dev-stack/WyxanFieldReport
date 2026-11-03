import type { StoredReport } from '../domain.ts';

/**
 * Where committed reports live. MongoDB in the app, in-memory in tests; the
 * routes only see this interface.
 */
export type ReportStore = {
  findById: (id: string) => Promise<StoredReport | null>;
  /**
   * Saves the report if its id is new. If it already exists, returns the
   * existing one unchanged: that is what makes a repeated commit (lost
   * response, retry) safe.
   */
  insertIfAbsent: (
    report: StoredReport,
  ) => Promise<{ report: StoredReport; created: boolean }>;
  /**
   * Newest first by when the inspector made it on the phone (then by when
   * it arrived). Not by arrival alone: a report that needed many retries
   * would otherwise jump above newer ones.
   */
  list: () => Promise<StoredReport[]>;
  deleteAll: () => Promise<void>;
};
