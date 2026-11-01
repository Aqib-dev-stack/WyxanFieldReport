import { asc, desc, eq, inArray } from 'drizzle-orm';

import { reportImages, reports } from '../schema';

import type { Database } from '../proxy';
import type { ReportImageRow, ReportRow } from '../schema';
import type { Report, ReportImage } from '@app-types';

export type NewReportInput = {
  id: string;
  description: string;
  createdAt: string;
  images: {
    id: string;
    position: number;
    originalUri: string;
    localPath: string | null;
  }[];
};

export type ReportPatch = Partial<
  Pick<
    ReportRow,
    'status' | 'attemptCount' | 'nextAttemptAt' | 'lastError' | 'failureKind'
  >
>;

export type ReportImagePatch = Partial<
  Pick<
    ReportImageRow,
    'status' | 'localPath' | 'compressedPath' | 'sizeBytes' | 'width' | 'height'
  >
>;

const toReportImage = (row: ReportImageRow): ReportImage => ({
  id: row.id,
  reportId: row.reportId,
  position: row.position,
  // Stored as paths; <Image> needs a file:// URI. Show the small upload
  // copy once it exists (decoding an 18 MB original for a thumbnail is waste).
  localUri:
    row.compressedPath || row.localPath
      ? `file://${row.compressedPath ?? row.localPath}`
      : null,
  originalPath: row.localPath,
  uploadPath: row.compressedPath,
  sizeBytes: row.sizeBytes,
  width: row.width,
  height: row.height,
  status: row.status,
});

const toReport = (row: ReportRow, images: ReportImageRow[]): Report => ({
  id: row.id,
  description: row.description,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  attemptCount: row.attemptCount,
  nextAttemptAt: row.nextAttemptAt,
  lastError: row.lastError,
  failureKind: row.failureKind,
  images: images.map(toReportImage),
});

/**
 * The only place that queries the reports tables. Takes the database as an
 * argument (like Bondii_App's services), so tests pass in an in-memory one.
 * Returns domain types, never raw rows.
 */
export const createReportsRepository = (db: Database) => {
  const imagesFor = async (reportIds: string[]) => {
    if (reportIds.length === 0) {
      return new Map<string, ReportImageRow[]>();
    }
    const rows = await db
      .select()
      .from(reportImages)
      .where(inArray(reportImages.reportId, reportIds))
      .orderBy(asc(reportImages.position));
    const byReport = new Map<string, ReportImageRow[]>();
    for (const row of rows) {
      byReport.set(row.reportId, [...(byReport.get(row.reportId) ?? []), row]);
    }
    return byReport;
  };

  return {
    /** Saves a report and all its photo rows in one transaction: all or nothing. */
    async create(input: NewReportInput): Promise<void> {
      const [first, ...rest] = input.images;
      if (!first) {
        throw new Error('A report needs at least one photo');
      }
      await db.batch([
        db.insert(reports).values({
          id: input.id,
          description: input.description,
          status: 'queued',
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        }),
        db
          .insert(reportImages)
          .values(
            [first, ...rest].map(image => ({ ...image, reportId: input.id })),
          ),
      ]);
    },

    /** All local reports, newest first, with their photos in order. */
    async list(): Promise<Report[]> {
      const rows = await db
        .select()
        .from(reports)
        .orderBy(desc(reports.createdAt));
      const images = await imagesFor(rows.map(row => row.id));
      return rows.map(row => toReport(row, images.get(row.id) ?? []));
    },

    async getById(id: string): Promise<Report | null> {
      const row = await db
        .select()
        .from(reports)
        .where(eq(reports.id, id))
        .get();
      if (!row) {
        return null;
      }
      const images = await imagesFor([id]);
      return toReport(row, images.get(id) ?? []);
    },

    /** Changes a report's upload state; always stamps `updatedAt`. */
    async update(
      id: string,
      patch: ReportPatch,
      now: string = new Date().toISOString(),
    ): Promise<void> {
      await db
        .update(reports)
        .set({ ...patch, updatedAt: now })
        .where(eq(reports.id, id));
    },

    async updateImage(id: string, patch: ReportImagePatch): Promise<void> {
      await db.update(reportImages).set(patch).where(eq(reportImages.id, id));
    },

    /** Start over: every local report and photo row. The server is untouched. */
    async deleteAll(): Promise<void> {
      await db.batch([db.delete(reportImages), db.delete(reports)]);
    },
  };
};

export type ReportsRepository = ReturnType<typeof createReportsRepository>;
