import type {
  OutboxItem,
  Report,
  ReportImageStatus,
  ReportStatus,
} from '@app-types';

/**
 * UI-phase mock data: one or more reports in every status. Timestamps are
 * relative to app start so "12 min ago" stays believable. Removed in phase 8
 * when the Outbox reads the local database.
 */

const MINUTE = 60 * 1000;
const ago = (minutes: number) =>
  new Date(Date.now() - minutes * MINUTE).toISOString();

type MockInput = {
  id: string;
  description: string;
  status: ReportStatus;
  minutesAgo: number;
  photos: number;
  /** How many photos the server already has (uploading / committing / uploaded). */
  uploadedPhotos?: number;
  lastError?: string;
  attemptCount?: number;
};

const imageStatusFor = (
  status: ReportStatus,
  position: number,
  uploadedPhotos: number,
): ReportImageStatus => {
  if (position < uploadedPhotos) {
    return 'uploaded';
  }
  return status === 'queued' ||
    status === 'waitingNet' ||
    status === 'compressing'
    ? 'pending'
    : 'compressed';
};

const makeReport = ({
  id,
  description,
  status,
  minutesAgo,
  photos,
  uploadedPhotos = 0,
  lastError,
  attemptCount = 0,
}: MockInput): Report => ({
  id,
  description,
  status,
  createdAt: ago(minutesAgo),
  updatedAt: ago(Math.max(0, minutesAgo - 1)),
  attemptCount,
  nextAttemptAt: null,
  lastError: lastError ?? null,
  failureKind: status === 'failed' ? 'permanent' : null,
  images: Array.from({ length: photos }, (_, position) => {
    const imageStatus = imageStatusFor(status, position, uploadedPhotos);
    const compressed = imageStatus !== 'pending';
    return {
      id: `${id}-img-${position}`,
      reportId: id,
      position,
      localUri: null,
      originalPath: null,
      uploadPath: null,
      // Compressed photos have a known size, always under 5 MB.
      sizeBytes: compressed ? 1_350_000 + position * 420_000 : null,
      width: compressed ? 2400 : null,
      height: compressed ? 1800 : null,
      status: imageStatus,
    };
  }),
});

const reports: Report[] = [
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c01',
    description:
      'Corrosion on the east pump housing flange. Bolts 3 and 4 show heavy rust; no active leak seen.',
    status: 'failed',
    minutesAgo: 95,
    photos: 2,
    attemptCount: 3,
    lastError: 'The server refused this report. Check it and try again.',
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c02',
    description:
      'Crack along the north retaining wall, about 2 m long, widening near the drain outlet. Soil washout below.',
    status: 'uploading',
    minutesAgo: 14,
    photos: 5,
    uploadedPhotos: 2,
    attemptCount: 1,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c03',
    description: 'Fence panel down at gate B.',
    status: 'committing',
    minutesAgo: 22,
    photos: 3,
    uploadedPhotos: 3,
    attemptCount: 1,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c04',
    description:
      'Transformer T2 enclosure: door hinge broken, warning sign missing. Area taped off until repair.',
    status: 'compressing',
    minutesAgo: 6,
    photos: 4,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c05',
    description:
      'Standing water across access road km 4.2 after last night’s rain. Passable with 4x4 only.',
    status: 'waitingNet',
    minutesAgo: 41,
    photos: 2,
    attemptCount: 2,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c06',
    description: 'Daily check of the generator room. All normal.',
    status: 'queued',
    minutesAgo: 2,
    photos: 1,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c07',
    description:
      'Pipe rack support P-17: paint blistering and surface rust over roughly 30 cm. Recommend inspection within a month.',
    status: 'uploaded',
    minutesAgo: 60 * 20,
    photos: 3,
    uploadedPhotos: 3,
    attemptCount: 1,
  }),
  makeReport({
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c08',
    description:
      'Fire extinguisher at control room entrance past its service date.',
    status: 'uploaded',
    minutesAgo: 60 * 52,
    photos: 1,
    uploadedPhotos: 1,
    attemptCount: 2,
  }),
];

/** Byte progress of the photo in flight, per uploading report (mock). */
const IN_FLIGHT_FRACTION: Record<string, number> = {
  'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c02': 0.4,
};

const toOutboxItem = (report: Report): OutboxItem => {
  if (report.status !== 'uploading') {
    return { report, progress: null };
  }
  const totalPhotos = report.images.length;
  const uploadedPhotos = report.images.filter(
    image => image.status === 'uploaded',
  ).length;
  const inFlight = IN_FLIGHT_FRACTION[report.id] ?? 0;
  return {
    report,
    progress: {
      uploadedPhotos,
      totalPhotos,
      fraction: (uploadedPhotos + inFlight) / totalPhotos,
    },
  };
};

export const MOCK_OUTBOX_ITEMS: OutboxItem[] = reports.map(toOutboxItem);
