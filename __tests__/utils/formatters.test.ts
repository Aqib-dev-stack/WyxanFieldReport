import {
  formatBytes,
  formatPhotoCount,
  formatRelativeTime,
} from '@utils/formatters';

// Local-time constructor, so the tests pass in any time zone.
const now = new Date(2026, 10, 3, 15, 0);
const at = (day: number, hour: number, minute: number, second = 0) =>
  new Date(2026, 10, day, hour, minute, second).toISOString();

describe('formatRelativeTime', () => {
  it.each([
    [at(3, 14, 59, 30), 'Just now'],
    [at(3, 14, 48), '12 min ago'],
    [at(3, 9, 5), 'Today 09:05'],
    [at(2, 18, 30), 'Yesterday 18:30'],
    [at(1, 7, 0), '1 Nov 07:00'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

describe('formatPhotoCount', () => {
  it('uses the singular for one photo', () => {
    expect(formatPhotoCount(1)).toBe('1 photo');
    expect(formatPhotoCount(5)).toBe('5 photos');
  });
});

describe('formatBytes', () => {
  it('uses KB below 1 MB and one decimal for MB', () => {
    expect(formatBytes(850_000)).toBe('850 KB');
    expect(formatBytes(2_140_000)).toBe('2.1 MB');
    expect(formatBytes(4_990_000)).toBe('5.0 MB');
  });
});
