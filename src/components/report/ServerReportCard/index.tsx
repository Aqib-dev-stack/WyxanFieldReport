import { CircleCheck } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  COLORS,
  RADIUS,
  SIZES,
  SPACING,
  STATUS_APPEARANCE,
  TYPOGRAPHY,
} from '@config';
import {
  formatBytes,
  formatPhotoCount,
  formatRelativeTime,
} from '@utils/formatters';

import PhotoThumbnail from '../PhotoThumbnail';

import type { ServerReport } from '@app-types';

export type ServerReportCardProps = {
  report: ServerReport;
};

/** One report as the server holds it: cover, description, photos, received time. */
const ServerReportCard = ({ report }: ServerReportCardProps) => {
  const photoCount = formatPhotoCount(report.images.length);
  const totalSize = formatBytes(
    report.images.reduce((sum, image) => sum + image.sizeBytes, 0),
  );
  const received = formatRelativeTime(report.receivedAt);
  const cover = report.images.find(image => image.position === 0);

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${report.description}. ${photoCount}, ${totalSize}. Received ${received}.`}
    >
      <PhotoThumbnail uri={cover?.url ?? null} />
      <View style={styles.body}>
        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>
        <Text style={styles.meta}>
          {photoCount} · {totalSize}
        </Text>
        <View style={styles.received}>
          <CircleCheck
            size={SIZES.iconSm}
            color={STATUS_APPEARANCE.uploaded.color}
          />
          <Text style={styles.receivedText}>Received {received}</Text>
        </View>
      </View>
    </View>
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
  },
  body: { flex: 1, gap: SPACING.xs },
  description: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  received: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  receivedText: {
    ...TYPOGRAPHY.label,
    color: STATUS_APPEARANCE.uploaded.color,
  },
});

export default memo(ServerReportCard);
