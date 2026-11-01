import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  COLORS,
  RADIUS,
  SPACING,
  STATUS_APPEARANCE,
  TYPOGRAPHY,
} from '@config';
import { formatPhotoCount, formatRelativeTime } from '@utils/formatters';
import { getStatusText } from '@utils/reportStatus';

import ProgressBar from '../../common/ProgressBar';
import PhotoThumbnail from '../PhotoThumbnail';
import StatusBadge from '../StatusBadge';

import type { OutboxItem } from '@app-types';

export type ReportCardProps = {
  item: OutboxItem;
  onPress: (reportId: string) => void;
};

/**
 * One report in the Outbox: first photo, description (2 lines), photo count
 * and time, status, and upload progress while uploading. A failed report
 * gets a red edge and its reason, so it stands out in a long list.
 */
const ReportCard = ({ item, onPress }: ReportCardProps) => {
  const { report, progress } = item;
  const photoCount = formatPhotoCount(report.images.length);
  const time = formatRelativeTime(report.createdAt);
  const statusText = getStatusText(report.status, progress);
  const isFailed = report.status === 'failed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        report.description,
        `${photoCount}, ${time}`,
        statusText,
        isFailed ? report.lastError : null,
      ]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint="Opens the report"
      onPress={() => onPress(report.id)}
      android_ripple={{ color: COLORS.ripple }}
      style={({ pressed }) => [
        styles.card,
        isFailed && styles.failed,
        pressed && styles.pressed,
      ]}
    >
      <PhotoThumbnail uri={report.images[0]?.localUri ?? null} />

      <View style={styles.body}>
        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>
        <Text style={styles.meta}>
          {photoCount} · {time}
        </Text>

        <StatusBadge status={report.status} progress={progress} />

        {progress ? (
          <ProgressBar
            progress={progress.fraction}
            color={STATUS_APPEARANCE.uploading.color}
            accessibilityLabel="Upload progress"
          />
        ) : null}

        {isFailed && report.lastError ? (
          <Text style={styles.error}>{report.lastError}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  failed: {
    borderLeftWidth: 4,
    borderLeftColor: STATUS_APPEARANCE.failed.color,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: SPACING.sm },
  description: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: -SPACING.xs,
  },
  error: { ...TYPOGRAPHY.caption, color: STATUS_APPEARANCE.failed.color },
});

// Memoised: during uploads only the card whose progress changed re-renders.
export default memo(ReportCard);
