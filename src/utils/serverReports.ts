import type { ApiError, ApiResult, ServerReport } from '@app-types';

/**
 * What the On server screen can be showing. Every state is designed; there
 * is no "spinner forever".
 */
export type ServerReportsState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'success';
      reports: ServerReport[];
      /** When this list was fetched; shown so stale data never looks live. */
      fetchedAt: string;
      /** A later refresh failed; the list above is the last good one. */
      refreshError: ApiError | null;
    };

/**
 * Next state after a fetch. A failed refresh keeps the last good list (with
 * the error alongside) instead of wiping what the user was reading.
 */
export const applyFetchResult = (
  prev: ServerReportsState,
  result: ApiResult<ServerReport[]>,
  now: string,
): ServerReportsState => {
  if (result.ok) {
    return {
      status: 'success',
      reports: result.data,
      fetchedAt: now,
      refreshError: null,
    };
  }
  if (prev.status === 'success') {
    return { ...prev, refreshError: result.error };
  }
  return { status: 'error', error: result.error };
};

/** Short, user-facing reason for a failed request. */
export const describeApiError = (error: ApiError): string => {
  switch (error.kind) {
    case 'offline':
      return 'No connection to the server.';
    case 'timeout':
      return 'The server took too long to answer.';
    case 'server':
      return error.status
        ? `The server had a problem (error ${error.status}).`
        : 'The server had a problem.';
    case 'rejected':
      return error.status
        ? `The server refused the request (error ${error.status}).`
        : 'The server refused the request.';
  }
};
