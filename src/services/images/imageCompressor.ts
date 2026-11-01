import ImageResizer from '@bam.tech/react-native-image-resizer';
import { unlink } from '@dr.pogodin/react-native-fs';

import { REPORT_LIMITS } from '@config';

import { compressWithinLimit } from './compressionLadder';

import type { CompressedImage } from './compressionLadder';

/** Compresses the photo at `sourcePath` into `outputFolder`, under the limit. */
export type ImageCompressor = (
  sourcePath: string,
  outputFolder: string,
) => Promise<CompressedImage>;

/**
 * Native resize + JPEG re-encode (`@bam.tech/react-native-image-resizer`).
 * The decoding and encoding run on a native background thread, so an 18 MB
 * photo never blocks the JS thread or the UI; JS only picks the settings.
 *
 * - EXIF orientation is applied to the pixels, so portrait shots stay upright.
 * - Metadata is dropped (`keepMeta: false`): smaller, and no GPS location
 *   leaks to the server by accident.
 * - Always re-encodes, even small photos: one predictable format (JPEG) for
 *   the server, including HEIC/PNG picks from the gallery.
 */
export const compressImage: ImageCompressor = (sourcePath, outputFolder) =>
  compressWithinLimit(
    REPORT_LIMITS.maxImageBytes,
    async step => {
      const result = await ImageResizer.createResizedImage(
        `file://${sourcePath}`,
        step.maxDimension,
        step.maxDimension,
        'JPEG',
        step.quality,
        0,
        outputFolder,
        false,
        { mode: 'contain', onlyScaleDown: true },
      );
      return {
        path: result.path,
        sizeBytes: result.size,
        width: result.width,
        height: result.height,
      };
    },
    path => unlink(path).catch(() => undefined),
  );
