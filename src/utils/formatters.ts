const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const pad = (n: number) => String(n).padStart(2, '0');

const timeOfDay = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Short, local time for list rows: "Just now", "12 min ago", "Today 14:05",
 * "Yesterday 09:30", "3 Nov 16:20". 24-hour clock, built by hand so the
 * output is the same on every device and in Jest (no Intl differences).
 */
export const formatRelativeTime = (
  iso: string,
  now: Date = new Date(),
): string => {
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) {
    return 'Just now';
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)} min ago`;
  }

  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / (24 * HOUR),
  );
  if (dayDiff === 0) {
    return `Today ${timeOfDay(date)}`;
  }
  if (dayDiff === 1) {
    return `Yesterday ${timeOfDay(date)}`;
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${timeOfDay(date)}`;
};

/** "1 photo", "3 photos". */
export const formatPhotoCount = (count: number): string =>
  `${count} ${count === 1 ? 'photo' : 'photos'}`;

/** "850 KB", "2.1 MB". Decimal units, as phones show file sizes. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1_000_000) {
    return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  }
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};
