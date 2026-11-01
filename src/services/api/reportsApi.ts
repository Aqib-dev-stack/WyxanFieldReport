import { API_TIMEOUTS } from '@config/api';

import { requestJson } from './http';
import { uploadFile } from './uploadFile';

import type { ApiResult, ServerReport } from '@app-types';

export type UploadImageInput = {
  reportId: string;
  position: number;
  /** Local path of the compressed file (≤ 5 MB). */
  filePath: string;
  /** SHA-256 of the file: the server rejects the image if it arrives damaged. */
  sha256: string;
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
};

export type CommitInput = {
  id: string;
  description: string;
  imageCount: number;
  createdAt: string;
};

/** The three calls the app makes. An interface, so tests use a fake server. */
export type ReportsApi = {
  uploadImage: (input: UploadImageInput) => Promise<ApiResult<unknown>>;
  commitReport: (
    input: CommitInput,
    signal?: AbortSignal,
  ) => Promise<ApiResult<unknown>>;
  listReports: () => Promise<ApiResult<ServerReport[]>>;
};

const toServerReports = (data: unknown): ServerReport[] | null => {
  const reports = (data as { reports?: unknown } | null)?.reports;
  return Array.isArray(reports) ? (reports as ServerReport[]) : null;
};

export const createReportsApi = (baseUrl: string): ReportsApi => ({
  uploadImage: ({ reportId, position, filePath, sha256, signal, onProgress }) =>
    uploadFile({
      url: `${baseUrl}/reports/${reportId}/images/${position}`,
      fileUri: `file://${filePath}`,
      contentType: 'image/jpeg',
      headers: { 'X-Content-SHA256': sha256 },
      stallMs: API_TIMEOUTS.uploadStallMs,
      signal,
      onProgress,
    }),

  commitReport: ({ id, ...body }, signal) =>
    requestJson(`${baseUrl}/reports/${id}/commit`, {
      method: 'POST',
      body,
      timeoutMs: API_TIMEOUTS.requestMs,
      signal,
    }),

  async listReports() {
    const result = await requestJson(`${baseUrl}/reports`, {
      timeoutMs: API_TIMEOUTS.requestMs,
    });
    if (!result.ok) {
      return result;
    }
    const reports = toServerReports(result.data);
    return reports
      ? { ok: true, data: reports }
      : { ok: false, error: { kind: 'server' } };
  },
});
