/** One attempt: fit within maxDimension × maxDimension, JPEG at `quality` (0–100). */
export type CompressionStep = { maxDimension: number; quality: number };

/**
 * Tried in order until the file is under the limit. The first step keeps
 * ~8 MP at high quality, which is sharp on a laptop screen and usually
 * 1.5–3 MB for an 18 MB camera original; later steps only kick in for
 * unusually detailed images. Quality drops before resolution does.
 */
export const COMPRESSION_STEPS: readonly CompressionStep[] = [
  { maxDimension: 3264, quality: 85 },
  { maxDimension: 3264, quality: 72 },
  { maxDimension: 2560, quality: 72 },
  { maxDimension: 2048, quality: 65 },
  { maxDimension: 1600, quality: 60 },
];

export type CompressedImage = {
  path: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export class ImageTooLargeError extends Error {}

/**
 * Runs `attempt` for each step until a result is within `limitBytes`.
 * Oversized results are discarded so they never linger on disk. Pure
 * orchestration (the actual work is native), so it is unit tested.
 */
export const compressWithinLimit = async (
  limitBytes: number,
  attempt: (step: CompressionStep) => Promise<CompressedImage>,
  discard: (path: string) => Promise<void>,
  steps: readonly CompressionStep[] = COMPRESSION_STEPS,
): Promise<CompressedImage> => {
  for (const step of steps) {
    const result = await attempt(step);
    if (result.sizeBytes <= limitBytes) {
      return result;
    }
    await discard(result.path);
  }
  throw new ImageTooLargeError(
    `Could not get the photo under ${limitBytes} bytes`,
  );
};
