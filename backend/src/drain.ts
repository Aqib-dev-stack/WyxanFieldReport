import type { Request } from 'express';

/**
 * Bodies up to this size are read (and thrown away) before we answer with
 * an error. Larger ones are cut off immediately.
 */
export const DRAIN_LIMIT_BYTES = 10_000_000;

/**
 * Runs `answer` once the request body has been fully received.
 *
 * Why: if the server answers an upload with an error before reading its
 * body, Node closes the connection while the phone is still sending, and the
 * phone sees a broken connection instead of the status code. A broken
 * connection looks temporary (retry), but a 413 is permanent (don't). So for
 * refusals we let the body arrive first; reading a few MB is far cheaper
 * than a phone retrying the same refused upload forever.
 */
export const afterBody = (req: Request, answer: () => void) => {
  const declared = Number(req.get('content-length') ?? 0);
  if (req.readableEnded || declared === 0 || declared > DRAIN_LIMIT_BYTES) {
    answer();
    return;
  }
  req.once('end', answer);
  req.once('error', () => undefined);
  req.resume();
};
