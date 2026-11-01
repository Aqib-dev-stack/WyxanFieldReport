import { createHash } from 'node:crypto';

import express from 'express';

import {
  isReportId,
  looksLikeJpeg,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  parsePosition,
} from '../domain.ts';
import { afterBody } from '../drain.ts';
import { HttpError } from '../httpError.ts';

import type { ImageFiles } from '../imageFiles.ts';
import type { ReportStore } from '../store/reportStore.ts';
import type { Request } from 'express';

const reportIdFrom = (req: Request) => {
  const id = String(req.params.id);
  if (!isReportId(id)) {
    throw new HttpError(400, 'invalidId', 'Report id must be a UUID');
  }
  return id;
};

const baseUrl = (req: Request) => `${req.protocol}://${req.get('host')}`;

export const reportsRouter = ({
  store,
  files,
}: {
  store: ReportStore;
  files: ImageFiles;
}) => {
  const router = express.Router();

  /**
   * PUT /reports/:id/images/:position — one image, raw JPEG body.
   * Idempotent: the same slot is overwritten, never duplicated.
   */
  router.put(
    '/:id/images/:position',
    (req, _res, next) => {
      // Check everything we can from the URL and headers first, so a
      // bad upload is refused without storing anything.
      const problem = !isReportId(String(req.params.id))
        ? new HttpError(400, 'invalidId', 'Report id must be a UUID')
        : parsePosition(String(req.params.position)) === null
        ? new HttpError(
            400,
            'invalidPosition',
            `Position must be 0–${MAX_IMAGES - 1}`,
          )
        : !req.is('image/jpeg')
        ? new HttpError(415, 'unsupportedType', 'Send image/jpeg')
        : Number(req.get('content-length') ?? 0) > MAX_IMAGE_BYTES
        ? new HttpError(413, 'imageTooLarge', 'Images must be ≤ 5 MB')
        : null;
      if (problem) {
        // Let the body arrive so the phone actually sees the status code.
        afterBody(req, () => next(problem));
        return;
      }
      next();
    },
    // Enforces the limit while reading too (e.g. chunked bodies) → 413.
    express.raw({ type: () => true, limit: MAX_IMAGE_BYTES }),
    async (req, res) => {
      const id = reportIdFrom(req);
      const position = parsePosition(String(req.params.position)) ?? 0;
      const body = req.body as Buffer;

      if (!Buffer.isBuffer(body) || body.length === 0) {
        throw new HttpError(400, 'emptyBody', 'No image data received');
      }
      if (!looksLikeJpeg(body)) {
        throw new HttpError(400, 'notJpeg', 'The body is not a JPEG image');
      }
      const sha256 = createHash('sha256').update(body).digest('hex');
      const expected = req.get('x-content-sha256');
      if (expected && expected.toLowerCase() !== sha256) {
        throw new HttpError(400, 'checksumMismatch', 'Image arrived damaged');
      }

      // Already committed: the report is final. Answer success so a late
      // retry from the phone simply moves on.
      if (await store.findById(id)) {
        res.status(200).json({ id, position, sizeBytes: body.length, sha256 });
        return;
      }

      await files.save(id, position, body);
      res.status(200).json({ id, position, sizeBytes: body.length, sha256 });
    },
  );

  /**
   * POST /reports/:id/commit — marks the report complete once all its
   * images are here. First call 201, repeats 200 with the same report.
   */
  router.post(
    '/:id/commit',
    express.json({ limit: '16kb' }),
    async (req, res) => {
      const id = reportIdFrom(req);

      const existing = await store.findById(id);
      if (existing) {
        res.status(200).json({ report: existing });
        return;
      }

      const { description, imageCount, createdAt } = (req.body ?? {}) as {
        description?: unknown;
        imageCount?: unknown;
        createdAt?: unknown;
      };
      const text = typeof description === 'string' ? description.trim() : '';
      if (text.length === 0 || text.length > MAX_DESCRIPTION_LENGTH) {
        throw new HttpError(
          400,
          'invalidDescription',
          `Description must be 1–${MAX_DESCRIPTION_LENGTH} characters`,
        );
      }
      if (
        typeof imageCount !== 'number' ||
        !Number.isInteger(imageCount) ||
        imageCount < 1 ||
        imageCount > MAX_IMAGES
      ) {
        throw new HttpError(
          400,
          'invalidImageCount',
          `A report has 1–${MAX_IMAGES} images`,
        );
      }
      if (
        typeof createdAt !== 'string' ||
        Number.isNaN(Date.parse(createdAt))
      ) {
        throw new HttpError(
          400,
          'invalidCreatedAt',
          'createdAt must be ISO 8601',
        );
      }

      const images = [];
      const missing = [];
      for (let position = 0; position < imageCount; position += 1) {
        const sizeBytes = await files.sizeOf(id, position);
        if (sizeBytes === null) {
          missing.push(position);
        } else {
          images.push({
            position,
            file: files.relative(id, position),
            sizeBytes,
          });
        }
      }
      if (missing.length > 0) {
        // The phone re-sends these images, then commits again.
        throw new HttpError(409, 'missingImages', 'Some images are missing', {
          missing,
        });
      }

      const { report, created } = await store.insertIfAbsent({
        id,
        description: text,
        images,
        createdAt,
        receivedAt: new Date().toISOString(),
      });
      res.status(created ? 201 : 200).json({ report });
    },
  );

  /** GET /reports — complete reports only, newest received first. */
  router.get('/', async (req, res) => {
    const reports = await store.list();
    const root = baseUrl(req);
    res.json({
      reports: reports.map(report => ({
        id: report.id,
        description: report.description,
        createdAt: report.createdAt,
        receivedAt: report.receivedAt,
        images: report.images.map(image => ({
          position: image.position,
          sizeBytes: image.sizeBytes,
          url: `${root}/uploads/${image.file}`,
        })),
      })),
    });
  });

  return router;
};
