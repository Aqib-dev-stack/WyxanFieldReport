/** Same limits as the app (src/config/constants.ts there). */
export const MAX_IMAGE_BYTES = 5_000_000;
export const MAX_IMAGES = 5;
export const MAX_DESCRIPTION_LENGTH = 500;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Report ids are made on the phone (UUID); they are the idempotency key. */
export const isReportId = (value: string) => UUID.test(value);

export const parsePosition = (value: string): number | null => {
  const position = Number(value);
  return Number.isInteger(position) && position >= 0 && position < MAX_IMAGES
    ? position
    : null;
};

/** JPEG files start with FF D8 FF. A cheap check that we got an image. */
export const looksLikeJpeg = (bytes: Buffer) =>
  bytes.length >= 3 &&
  bytes[0] === 0xff &&
  bytes[1] === 0xd8 &&
  bytes[2] === 0xff;

export type StoredImage = {
  position: number;
  /** Path under the upload dir, e.g. "<id>/0.jpg". */
  file: string;
  sizeBytes: number;
};

/** A report the server holds. Only complete (committed) reports exist. */
export type StoredReport = {
  id: string;
  description: string;
  images: StoredImage[];
  /** When the inspector made it on the phone (from the client). */
  createdAt: string;
  /** When the server first committed it. */
  receivedAt: string;
};
