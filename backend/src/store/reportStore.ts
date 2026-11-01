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
  /** Newest received first. */
  list: () => Promise<StoredReport[]>;
  deleteAll: () => Promise<void>;
};
