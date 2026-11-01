import { afterBody } from './drain.ts';

import type { RequestHandler } from 'express';

/**
 * Failure modes for testing the app's upload engine against a real server.
 *
 *   ok            normal
 *   slow          waits (SLOW_DELAY_MS) before handling: a crawling link
 *   drop          closes the connection without reading or answering
 *   lostResponse  does the work, then closes the connection instead of
 *                 answering: the app must retry, and the retry must not
 *                 create a duplicate
 *   error500      answers 500 (temporary: the app should retry)
 *   reject413     answers 413 to image uploads (permanent: the app must not
 *                 retry the same bytes)
 *   hang          never answers: the app's timeout must kick in
 */
export const CHAOS_MODES = [
  'ok',
  'slow',
  'drop',
  'lostResponse',
  'error500',
  'reject413',
  'hang',
] as const;

export type ChaosMode = (typeof CHAOS_MODES)[number];

export const isChaosMode = (value: unknown): value is ChaosMode =>
  typeof value === 'string' &&
  (CHAOS_MODES as readonly string[]).includes(value);

export type ChaosState = {
  mode: ChaosMode;
  /** Requests left before going back to `ok`; null = until changed. */
  remaining: number | null;
};

export const createChaos = (slowDelayMs: number) => {
  let state: ChaosState = { mode: 'ok', remaining: null };

  /** Takes one request's worth of chaos; returns the mode to apply. */
  const consume = (): ChaosMode => {
    const { mode, remaining } = state;
    if (remaining !== null) {
      state =
        remaining <= 1
          ? { mode: 'ok', remaining: null }
          : { mode, remaining: remaining - 1 };
    }
    return mode;
  };

  const middleware: RequestHandler = (req, res, next) => {
    if (state.mode === 'ok') {
      next();
      return;
    }
    // 413 is about image bodies; other requests pass untouched.
    if (state.mode === 'reject413' && req.method !== 'PUT') {
      next();
      return;
    }
    const mode = consume();
    console.log(`[chaos] ${mode}: ${req.method} ${req.originalUrl}`);

    switch (mode) {
      case 'ok':
        next();
        return;
      case 'slow':
        setTimeout(next, slowDelayMs);
        return;
      case 'drop':
        req.socket.destroy();
        return;
      case 'lostResponse':
        // Let the route do its work, then drop the connection instead of answering.
        res.json = (() => {
          req.socket.destroy();
          return res;
        }) as typeof res.json;
        next();
        return;
      case 'error500':
        afterBody(req, () =>
          res
            .status(500)
            .json({ error: 'chaos', message: 'Simulated server error' }),
        );
        return;
      case 'reject413':
        afterBody(req, () =>
          res
            .status(413)
            .json({ error: 'imageTooLarge', message: 'Simulated 413' }),
        );
        return;
      case 'hang':
        return; // never answer
    }
  };

  return {
    middleware,
    get: (): ChaosState => state,
    set: (mode: ChaosMode, times: number | null) => {
      state = { mode, remaining: mode === 'ok' ? null : times };
    },
  };
};

export type Chaos = ReturnType<typeof createChaos>;
