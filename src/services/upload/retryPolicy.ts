import type { ApiError } from '@app-types';

/**
 * What to do after a failed request.
 *   retry   temporary: try again after a backoff delay, no user action
 *   fail    permanent: retrying the same request would fail the same way,
 *           so stop and tell the user ("needs attention")
 */
export type FailureDecision =
  | { kind: 'retry'; waitingForNetwork: boolean; message: string }
  | { kind: 'fail'; message: string };

/**
 * The one place that decides retry vs. give up. Only failures that can
 * succeed later are retried: no connection, a stalled link, a hung or
 * overloaded server (5xx, 408, 429). A refusal (413, 400, ...) is final.
 */
export const decideOnFailure = (error: ApiError): FailureDecision => {
  switch (error.kind) {
    case 'offline':
      return {
        kind: 'retry',
        waitingForNetwork: true,
        message: 'No connection. It will upload when the network is back.',
      };
    case 'timeout':
      return {
        kind: 'retry',
        waitingForNetwork: true,
        message: 'The connection stalled. Trying again shortly.',
      };
    case 'server':
      return {
        kind: 'retry',
        waitingForNetwork: false,
        message: 'The server is having trouble. Trying again shortly.',
      };
    case 'rejected':
      return {
        kind: 'fail',
        message:
          error.status === 413
            ? 'The server refused a photo as too large.'
            : `The server refused this report${
                error.status ? ` (error ${error.status})` : ''
              }. Check it and try again.`,
      };
  }
};

export const BACKOFF = {
  baseMs: 2_000,
  maxMs: 5 * 60_000,
  minMs: 1_000,
} as const;

/**
 * Delay before attempt `attempt + 1` (attempt counts from 1): exponential
 * (2 s, 4 s, 8 s ... capped at 5 min) with "full jitter", a random point in
 * [0, cap]. The jitter keeps many phones that lost signal together from all
 * retrying at the same instant; the cap keeps a phone that's been offline for
 * hours checking at least every 5 minutes.
 */
export const backoffDelay = (
  attempt: number,
  random: () => number = Math.random,
): number => {
  const ceiling = Math.min(
    BACKOFF.maxMs,
    BACKOFF.baseMs * 2 ** Math.max(0, attempt - 1),
  );
  return Math.max(BACKOFF.minMs, Math.round(random() * ceiling));
};
