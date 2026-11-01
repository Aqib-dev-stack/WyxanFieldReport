import express from 'express';

import { HttpError } from './httpError.ts';
import { adminRouter } from './routes/admin.ts';
import { reportsRouter } from './routes/reports.ts';

import type { Chaos } from './chaos.ts';
import type { ImageFiles } from './imageFiles.ts';
import type { ReportStore } from './store/reportStore.ts';
import type { ErrorRequestHandler } from 'express';

export type AppDeps = {
  store: ReportStore;
  files: ImageFiles;
  uploadDir: string;
  chaos: Chaos;
  enableAdmin: boolean;
  log?: boolean;
};

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ error: error.code, message: error.message, ...error.details });
    return;
  }
  // body-parser errors carry a `type`.
  const type = (error as { type?: string }).type;
  if (type === 'entity.too.large') {
    res
      .status(413)
      .json({ error: 'imageTooLarge', message: 'Images must be ≤ 5 MB' });
    return;
  }
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalidJson', message: 'Malformed JSON' });
    return;
  }
  if (type === 'request.aborted') {
    return; // the client went away mid-upload; nothing to answer
  }
  console.error(error);
  res.status(500).json({ error: 'internal', message: 'Something went wrong' });
};

/** The HTTP app, built from its dependencies so tests can swap them. */
export const createApp = ({
  store,
  files,
  uploadDir,
  chaos,
  enableAdmin,
  log = true,
}: AppDeps) => {
  const app = express();
  app.disable('x-powered-by');

  if (log) {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on('finish', () =>
        console.log(
          `${req.method} ${req.originalUrl} ${res.statusCode} ${
            Date.now() - started
          }ms`,
        ),
      );
      next();
    });
  }

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  // Image files never change once stored, so they can be cached hard.
  app.use(
    '/uploads',
    express.static(uploadDir, { immutable: true, maxAge: '30d' }),
  );
  // Chaos applies to the app's API only, not to health, files or admin.
  app.use('/reports', chaos.middleware, reportsRouter({ store, files }));
  if (enableAdmin) {
    app.use('/admin', adminRouter({ chaos, store, files }));
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'notFound', message: 'No such endpoint' });
  });
  app.use(errorHandler);
  return app;
};
