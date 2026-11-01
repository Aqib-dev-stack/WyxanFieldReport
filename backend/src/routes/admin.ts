import express from 'express';

import { CHAOS_MODES, isChaosMode } from '../chaos.ts';
import { HttpError } from '../httpError.ts';

import type { Chaos } from '../chaos.ts';
import type { ImageFiles } from '../imageFiles.ts';
import type { ReportStore } from '../store/reportStore.ts';

/**
 * Test-only controls. Mounted only when ENABLE_ADMIN=true.
 *
 *   POST /admin/chaos  { "mode": "drop", "times": 2 }   next 2 requests dropped
 *   GET  /admin/chaos                                    current mode
 *   POST /admin/reset                                    delete every report + image
 */
export const adminRouter = ({
  chaos,
  store,
  files,
}: {
  chaos: Chaos;
  store: ReportStore;
  files: ImageFiles;
}) => {
  const router = express.Router();
  router.use(express.json({ limit: '4kb' }));

  router.get('/chaos', (_req, res) => {
    res.json({ ...chaos.get(), modes: CHAOS_MODES });
  });

  router.post('/chaos', (req, res) => {
    const { mode, times } = (req.body ?? {}) as {
      mode?: unknown;
      times?: unknown;
    };
    if (!isChaosMode(mode)) {
      throw new HttpError(
        400,
        'invalidMode',
        `Mode must be one of: ${CHAOS_MODES.join(', ')}`,
      );
    }
    const count =
      typeof times === 'number' && Number.isInteger(times) && times > 0
        ? times
        : null;
    chaos.set(mode, count);
    res.json(chaos.get());
  });

  router.post('/reset', async (_req, res) => {
    await store.deleteAll();
    await files.deleteAll();
    res.json({ ok: true });
  });

  return router;
};
