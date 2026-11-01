/**
 * What the server returns for `GET /reports`: complete (committed) reports
 * only. Separate from the local `Report` type on purpose: the Review screen
 * shows the server's facts, never local state.
 */
export type ServerReportImage = {
  position: number;
  /** Public URL of the stored image. `null` in mock data. */
  url: string | null;
  sizeBytes: number;
};

export type ServerReport = {
  /** Same UUID the phone generated. */
  id: string;
  description: string;
  images: ServerReportImage[];
  /** When the inspector created it on the phone (ISO 8601). */
  createdAt: string;
  /** When the server marked it complete (ISO 8601). */
  receivedAt: string;
};

/**
 * Why a request failed, in terms the app can act on:
 *   offline   no connection reached the server (or it dropped mid-way)
 *   timeout   nothing moved for too long (stalled upload, hung server)
 *   server    the server had a problem (5xx, 408, 429): try again later
 *   rejected  the server refused the request (other 4xx): retrying the same
 *             thing will fail the same way
 */
export type ApiErrorKind = 'offline' | 'timeout' | 'server' | 'rejected';

export type ApiError = {
  kind: ApiErrorKind;
  /** HTTP status when the server answered. */
  status?: number;
  /** The server's error code, e.g. "imageTooLarge", "missingImages". */
  code?: string;
  /** For "missingImages": positions the server doesn't have. */
  missing?: number[];
};

/** Requests return a result instead of throwing, so every caller handles failure. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
