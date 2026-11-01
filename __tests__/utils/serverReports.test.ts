import { applyFetchResult, describeApiError } from '@utils/serverReports';

import type { ServerReport } from '@app-types';
import type { ServerReportsState } from '@utils/serverReports';

const report: ServerReport = {
  id: 'r1',
  description: 'Crack',
  images: [{ position: 0, url: null, sizeBytes: 1_000_000 }],
  createdAt: '2026-11-01T10:00:00.000Z',
  receivedAt: '2026-11-01T10:05:00.000Z',
};
const T1 = '2026-11-01T11:00:00.000Z';
const T2 = '2026-11-01T12:00:00.000Z';

describe('applyFetchResult', () => {
  it('shows the list on success', () => {
    expect(
      applyFetchResult({ status: 'loading' }, { ok: true, data: [report] }, T1),
    ).toEqual({
      status: 'success',
      reports: [report],
      fetchedAt: T1,
      refreshError: null,
    });
  });

  it('shows an error state when the first load fails', () => {
    expect(
      applyFetchResult(
        { status: 'loading' },
        { ok: false, error: { kind: 'offline' } },
        T1,
      ),
    ).toEqual({ status: 'error', error: { kind: 'offline' } });
  });

  it('keeps the last good list, and its time, when a refresh fails', () => {
    const shown: ServerReportsState = {
      status: 'success',
      reports: [report],
      fetchedAt: T1,
      refreshError: null,
    };
    expect(
      applyFetchResult(
        shown,
        { ok: false, error: { kind: 'server', status: 500 } },
        T2,
      ),
    ).toEqual({ ...shown, refreshError: { kind: 'server', status: 500 } });
  });

  it('clears a previous refresh error after a successful refresh', () => {
    const stale: ServerReportsState = {
      status: 'success',
      reports: [],
      fetchedAt: T1,
      refreshError: { kind: 'timeout' },
    };
    const next = applyFetchResult(stale, { ok: true, data: [report] }, T2);
    expect(next).toMatchObject({ fetchedAt: T2, refreshError: null });
  });
});

describe('describeApiError', () => {
  it('mentions the HTTP status when there is one', () => {
    expect(describeApiError({ kind: 'server', status: 503 })).toBe(
      'The server had a problem (error 503).',
    );
  });
});
