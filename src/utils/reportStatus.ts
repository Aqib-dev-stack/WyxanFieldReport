import type {
  OutboxItem,
  Report,
  ReportImage,
  ReportStatus,
  UploadProgress,
} from '@app-types';
import type { PhotoDisplayStatus } from '@config';

/**
 * The one sentence a user reads for a status. "Saved on phone" and "Uploaded"
 * are different facts and never share a sentence: a report is only described
 * as uploaded once the server has confirmed it.
 */
export const getStatusText = (
  status: ReportStatus,
  progress: UploadProgress | null = null,
): string => {
  switch (status) {
    case 'queued':
      return 'Saved on phone · waiting to upload';
    case 'waitingNet':
      return 'Saved on phone · waiting for network';
    case 'compressing':
      return 'Preparing photos…';
    case 'uploading':
      if (!progress) {
        return 'Uploading photos';
      }
      // "3 of 5" names the photo being sent now, so it counts from 1.
      return `Uploading ${Math.min(
        progress.uploadedPhotos + 1,
        progress.totalPhotos,
      )} of ${progress.totalPhotos} photos`;
    case 'committing':
      return 'Finishing upload…';
    case 'uploaded':
      return 'Uploaded to server';
    case 'failed':
      return 'Upload failed';
  }
};

/** Statuses the app is actively working on. */
export const isActiveStatus = (status: ReportStatus): boolean =>
  status === 'compressing' || status === 'uploading' || status === 'committing';

/** Statuses that are saved on the phone and simply waiting their turn. */
export const isWaitingStatus = (status: ReportStatus): boolean =>
  status === 'queued' || status === 'waitingNet';

export type OutboxSummary = {
  waiting: number;
  uploading: number;
  failed: number;
  uploaded: number;
};

/** Counts for the summary strip ("2 waiting · 1 uploading · 1 failed"). */
export const summarizeOutbox = (items: OutboxItem[]): OutboxSummary =>
  items.reduce<OutboxSummary>(
    (acc, { report }) => {
      if (isWaitingStatus(report.status)) {
        acc.waiting += 1;
      } else if (isActiveStatus(report.status)) {
        acc.uploading += 1;
      } else if (report.status === 'failed') {
        acc.failed += 1;
      } else {
        acc.uploaded += 1;
      }
      return acc;
    },
    { waiting: 0, uploading: 0, failed: 0, uploaded: 0 },
  );

export type OutboxSectionKey = 'attention' | 'queue' | 'uploaded';

export type OutboxSection = {
  key: OutboxSectionKey;
  title: string;
  data: OutboxItem[];
};

const SECTION_TITLES: Record<OutboxSectionKey, string> = {
  attention: 'Needs attention',
  queue: 'In the queue',
  uploaded: 'Uploaded',
};

const byCreatedAt =
  (direction: 'oldest' | 'newest') => (a: OutboxItem, b: OutboxItem) => {
    const diff = a.report.createdAt.localeCompare(b.report.createdAt);
    return direction === 'oldest' ? diff : -diff;
  };

/**
 * Groups the Outbox so the most urgent thing is on top:
 * 1. Needs attention: failed reports.
 * 2. In the queue: the report being uploaded right now first (so the work
 *    in progress is in view), then the waiting ones.
 * 3. Uploaded.
 * Inside each group, newest first. Empty sections are left out.
 */
export const groupOutbox = (items: OutboxItem[]): OutboxSection[] => {
  const attention = items
    .filter(item => item.report.status === 'failed')
    .sort(byCreatedAt('newest'));
  const active = items
    .filter(item => isActiveStatus(item.report.status))
    .sort(byCreatedAt('newest'));
  const waiting = items
    .filter(item => isWaitingStatus(item.report.status))
    .sort(byCreatedAt('newest'));
  const uploaded = items
    .filter(item => item.report.status === 'uploaded')
    .sort(byCreatedAt('newest'));

  const sections: OutboxSection[] = [
    { key: 'attention', title: SECTION_TITLES.attention, data: attention },
    {
      key: 'queue',
      title: SECTION_TITLES.queue,
      data: [...active, ...waiting],
    },
    { key: 'uploaded', title: SECTION_TITLES.uploaded, data: uploaded },
  ];
  return sections.filter(section => section.data.length > 0);
};

/**
 * The longer "what is happening and what happens next" for Report detail.
 * Each answers: is it safe, is it moving, do I need to act?
 */
export const getStatusExplanation = (status: ReportStatus): string => {
  switch (status) {
    case 'queued':
      return 'This report is saved on this phone. It uploads automatically when its turn comes. Nothing to do.';
    case 'waitingNet':
      return 'This report is saved on this phone. There is no usable connection right now; the upload starts by itself when the network is back.';
    case 'compressing':
      return 'Making the photos smaller (under 5 MB each) so they send faster on a weak signal. The report is saved on this phone meanwhile.';
    case 'uploading':
      return 'Sending the photos one at a time. If the connection drops, it carries on from the last photo sent, without starting over.';
    case 'committing':
      return 'All photos have reached the server. Asking the server to file the complete report.';
    case 'uploaded':
      return 'The server has the complete report. You can also find it under On server.';
    case 'failed':
      return 'The server refused this report, so the app will not retry it on its own. It is still saved on this phone.';
  }
};

/**
 * A photo's state for display. While a report uploads, its first photo not
 * yet on the server is the one being sent.
 */
export const getPhotoDisplayStatus = (
  report: Report,
  image: ReportImage,
): PhotoDisplayStatus => {
  if (report.status === 'uploading' && image.status !== 'uploaded') {
    const inFlight = [...report.images]
      .sort((a, b) => a.position - b.position)
      .find(candidate => candidate.status !== 'uploaded');
    if (inFlight?.id === image.id) {
      return 'sending';
    }
  }
  return image.status;
};
