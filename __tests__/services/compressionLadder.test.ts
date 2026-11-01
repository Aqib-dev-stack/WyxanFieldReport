import {
  compressWithinLimit,
  ImageTooLargeError,
} from '@services/images/compressionLadder';

import type { CompressionStep } from '@services/images/compressionLadder';

const LIMIT = 5_000_000;

/** Fake native resize: size shrinks with dimension and quality. */
const fakeAttempt = (sizeFor: (step: CompressionStep) => number) =>
  jest.fn(async (step: CompressionStep) => ({
    path: `/tmp/${step.maxDimension}-${step.quality}.jpg`,
    sizeBytes: sizeFor(step),
    width: step.maxDimension,
    height: Math.round(step.maxDimension * 0.75),
  }));

describe('compressWithinLimit', () => {
  it('stops at the first step that fits (typical camera photo)', async () => {
    const attempt = fakeAttempt(() => 2_400_000);
    const discard = jest.fn(async () => undefined);

    const result = await compressWithinLimit(LIMIT, attempt, discard);

    expect(attempt).toHaveBeenCalledTimes(1);
    expect(discard).not.toHaveBeenCalled();
    expect(result.sizeBytes).toBeLessThanOrEqual(LIMIT);
  });

  it('lowers quality, then size, until under the limit, discarding misses', async () => {
    const attempt = fakeAttempt(step =>
      step.maxDimension >= 2560 ? 6_000_000 : 4_100_000,
    );
    const discard = jest.fn(async () => undefined);

    const result = await compressWithinLimit(LIMIT, attempt, discard);

    expect(result.width).toBe(2048);
    expect(discard).toHaveBeenCalledTimes(3);
  });

  it('accepts exactly the limit and never returns more', async () => {
    const atLimit = await compressWithinLimit(
      LIMIT,
      fakeAttempt(() => LIMIT),
      async () => undefined,
    );
    expect(atLimit.sizeBytes).toBe(LIMIT);

    await expect(
      compressWithinLimit(
        LIMIT,
        fakeAttempt(() => LIMIT + 1),
        async () => undefined,
      ),
    ).rejects.toBeInstanceOf(ImageTooLargeError);
  });
});
