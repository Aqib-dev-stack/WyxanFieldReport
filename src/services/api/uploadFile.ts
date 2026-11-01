import { errorFromResponse } from './http';

import type { ApiResult } from '@app-types';

/**
 * PUTs a local file as the raw request body, with byte progress.
 *
 * XMLHttpRequest, not fetch: fetch has no upload progress in React Native.
 * Timeout is a STALL timer, re-armed on every progress event: a slow 2G
 * upload that keeps moving is never cut, but one where nothing moves for
 * `stallMs` (dead link, hung server) is aborted and reported as a timeout.
 */
export const uploadFile = async ({
  url,
  fileUri,
  contentType,
  headers = {},
  stallMs,
  signal,
  onProgress,
}: {
  url: string;
  fileUri: string;
  contentType: string;
  headers?: Record<string, string>;
  stallMs: number;
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}): Promise<ApiResult<unknown>> => {
  // React Native reads a local file into a Blob natively (no base64 in JS).
  const blob = await (await fetch(fileUri)).blob();

  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const finish = (result: ApiResult<unknown>) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        xhr.abort();
      }, stallMs);
    };
    const onAbort = () => xhr.abort();

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    Object.entries(headers).forEach(([name, value]) =>
      xhr.setRequestHeader(name, value),
    );
    xhr.upload.onprogress = event => {
      arm();
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    // All bytes sent: now the server has `stallMs` to answer.
    xhr.upload.onload = () => arm();
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      finish(
        xhr.status >= 200 && xhr.status < 300
          ? { ok: true, data: body }
          : { ok: false, error: errorFromResponse(xhr.status, body) },
      );
    };
    xhr.onerror = () => finish({ ok: false, error: { kind: 'offline' } });
    xhr.onabort = () =>
      finish({
        ok: false,
        error: { kind: timedOut ? 'timeout' : 'offline' },
      });

    signal?.addEventListener('abort', onAbort);
    arm();
    xhr.send(blob);
  });
};
