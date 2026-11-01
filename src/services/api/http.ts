import type { ApiError, ApiResult } from '@app-types';

type ErrorBody = { error?: unknown; missing?: unknown };

/** Turns a non-2xx response into an `ApiError` the retry policy understands. */
export const errorFromResponse = (status: number, body: unknown): ApiError => {
  const { error, missing } = (body ?? {}) as ErrorBody;
  const retryable = status >= 500 || status === 408 || status === 429;
  return {
    kind: retryable ? 'server' : 'rejected',
    status,
    code: typeof error === 'string' ? error : undefined,
    missing: Array.isArray(missing)
      ? missing.filter((n): n is number => typeof n === 'number')
      : undefined,
  };
};

/**
 * JSON request with a timeout. Never throws: every outcome is an
 * `ApiResult`, so callers must decide what a failure means.
 */
export const requestJson = async (
  url: string,
  {
    method = 'GET',
    body,
    timeoutMs,
    signal,
  }: {
    method?: 'GET' | 'POST';
    body?: unknown;
    timeoutMs: number;
    signal?: AbortSignal;
  },
): Promise<ApiResult<unknown>> => {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const json: unknown = await response.json().catch(() => null);
    return response.ok
      ? { ok: true, data: json }
      : { ok: false, error: errorFromResponse(response.status, json) };
  } catch {
    return { ok: false, error: { kind: timedOut ? 'timeout' : 'offline' } };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
};
