import {
  getPhotoDisplayStatus,
  getStatusExplanation,
  getStatusText,
  groupOutbox,
  summarizeOutbox,
} from '@utils/reportStatus';

import { MOCK_OUTBOX_ITEMS } from '../../jest/fixtures/reports';

import type { OutboxItem, Report, ReportStatus } from '@app-types';

const item = (
  id: string,
  status: ReportStatus,
  createdAt: string,
): OutboxItem => ({
  report: {
    id,
    description: id,
    status,
    createdAt,
    updatedAt: createdAt,
    attemptCount: 0,
    nextAttemptAt: null,
    lastError: null,
    failureKind: null,
    images: [],
  } satisfies Report,
  progress: null,
});

describe('getStatusText', () => {
  it('never mixes "Saved on phone" with "Uploaded"', () => {
    expect(getStatusText('queued')).toBe('Saved on phone · waiting to upload');
    expect(getStatusText('waitingNet')).toBe(
      'Saved on phone · waiting for network',
    );
    expect(getStatusText('uploaded')).toBe('Uploaded to server');
  });

  it('names the photo being sent, counting from 1', () => {
    expect(
      getStatusText('uploading', {
        uploadedPhotos: 2,
        totalPhotos: 5,
        fraction: 0.48,
      }),
    ).toBe('Uploading 3 of 5 photos');
  });

  it('never counts past the total', () => {
    expect(
      getStatusText('uploading', {
        uploadedPhotos: 5,
        totalPhotos: 5,
        fraction: 1,
      }),
    ).toBe('Uploading 5 of 5 photos');
  });
});

describe('summarizeOutbox', () => {
  it('groups statuses into waiting / uploading / failed / uploaded', () => {
    expect(summarizeOutbox(MOCK_OUTBOX_ITEMS)).toEqual({
      waiting: 2,
      uploading: 3,
      failed: 1,
      uploaded: 2,
    });
  });
});

describe('groupOutbox', () => {
  it('puts failed first, active before waiting, waiting oldest first', () => {
    const sections = groupOutbox([
      item('waiting-new', 'queued', '2026-11-01T10:30:00.000Z'),
      item('done', 'uploaded', '2026-11-01T08:00:00.000Z'),
      item('waiting-old', 'waitingNet', '2026-11-01T10:00:00.000Z'),
      item('broken', 'failed', '2026-11-01T09:00:00.000Z'),
      item('sending', 'uploading', '2026-11-01T10:45:00.000Z'),
    ]);

    expect(sections.map(s => [s.key, s.data.map(i => i.report.id)])).toEqual([
      ['attention', ['broken']],
      ['queue', ['sending', 'waiting-old', 'waiting-new']],
      ['uploaded', ['done']],
    ]);
  });

  it('leaves out empty sections', () => {
    expect(groupOutbox([])).toEqual([]);
  });
});

describe('getPhotoDisplayStatus', () => {
  const uploading = MOCK_OUTBOX_ITEMS.find(
    i => i.report.status === 'uploading',
  )!.report;

  it('marks the first photo not yet on the server as sending', () => {
    expect(
      uploading.images.map(image => getPhotoDisplayStatus(uploading, image)),
    ).toEqual(['uploaded', 'uploaded', 'sending', 'compressed', 'compressed']);
  });

  it('shows stored statuses when the report is not uploading', () => {
    const queued = MOCK_OUTBOX_ITEMS.find(
      i => i.report.status === 'queued',
    )!.report;
    expect(getPhotoDisplayStatus(queued, queued.images[0])).toBe('pending');
  });
});

describe('getStatusExplanation', () => {
  it('only claims the server has the report once it is uploaded', () => {
    const others = (
      ['queued', 'waitingNet', 'compressing', 'uploading', 'failed'] as const
    ).map(getStatusExplanation);
    others.forEach(text => expect(text).not.toMatch(/server has/i));
    expect(getStatusExplanation('uploaded')).toMatch(/server has/i);
  });
});
