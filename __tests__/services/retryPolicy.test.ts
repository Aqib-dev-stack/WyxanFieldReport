import {
  BACKOFF,
  backoffDelay,
  decideOnFailure,
} from '@services/upload/retryPolicy';

describe('decideOnFailure', () => {
  it.each([
    [{ kind: 'offline' as const }, true],
    [{ kind: 'timeout' as const }, true],
    [{ kind: 'server' as const, status: 500 }, false],
  ])('retries %o (waiting for network: %s)', (error, waitingForNetwork) => {
    expect(decideOnFailure(error)).toMatchObject({
      kind: 'retry',
      waitingForNetwork,
    });
  });

  it('gives up on refusals: 413 and other 4xx', () => {
    expect(decideOnFailure({ kind: 'rejected', status: 413 })).toEqual({
      kind: 'fail',
      message: 'The server refused a photo as too large.',
    });
    expect(decideOnFailure({ kind: 'rejected', status: 400 }).kind).toBe(
      'fail',
    );
  });
});

describe('backoffDelay', () => {
  it('doubles the ceiling each attempt (with random = 1)', () => {
    expect([1, 2, 3, 4].map(n => backoffDelay(n, () => 1))).toEqual([
      2_000, 4_000, 8_000, 16_000,
    ]);
  });

  it('is capped at 5 minutes and never below 1 second', () => {
    expect(backoffDelay(30, () => 1)).toBe(BACKOFF.maxMs);
    expect(backoffDelay(5, () => 0)).toBe(BACKOFF.minMs);
  });
});
