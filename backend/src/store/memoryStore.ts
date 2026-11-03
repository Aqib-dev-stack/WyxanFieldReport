import type { StoredReport } from '../domain.ts';
import type { ReportStore } from './reportStore.ts';

/** In-memory store for tests. Same semantics as the MongoDB one. */
export const createMemoryStore = (): ReportStore => {
  const reports = new Map<string, StoredReport>();
  return {
    findById: async id => reports.get(id) ?? null,
    insertIfAbsent: async report => {
      const existing = reports.get(report.id);
      if (existing) {
        return { report: existing, created: false };
      }
      reports.set(report.id, report);
      return { report, created: true };
    },
    list: async () =>
      [...reports.values()].sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) ||
          b.receivedAt.localeCompare(a.receivedAt),
      ),
    deleteAll: async () => reports.clear(),
  };
};
