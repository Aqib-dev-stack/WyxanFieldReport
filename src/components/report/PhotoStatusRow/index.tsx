import { StyleSheet, Text, View } from 'react-native';

import {
  COLORS,
  PHOTO_STATUS_APPEARANCE,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@config';
import { formatBytes } from '@utils/formatters';

import PhotoThumbnail from '../PhotoThumbnail';

import type { ReportImage } from '@app-types';
import type { PhotoDisplayStatus } from '@config';

export type PhotoStatusRowProps = {
  image: ReportImage;
  displayStatus: PhotoDisplayStatus;
};

/** One photo of a report: preview, size (once compressed) and its own status. */
const PhotoStatusRow = ({ image, displayStatus }: PhotoStatusRowProps) => {
  const { icon: Icon, color, label } = PHOTO_STATUS_APPEARANCE[displayStatus];
  const name = `Photo ${image.position + 1}${
    image.position === 0 ? ' · Cover' : ''
  }`;
  const size = image.sizeBytes !== null ? formatBytes(image.sizeBytes) : null;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={[name, size, label].filter(Boolean).join(', ')}
    >
      <PhotoThumbnail uri={image.localUri} size={56} />
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.size}>{size ?? 'Not compressed yet'}</Text>
      </View>
      <View style={styles.status}>
        <Icon size={SIZES.iconSm} color={color} />
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  body: { flex: 1, gap: SPACING.xxs },
  name: { ...TYPOGRAPHY.body, fontWeight: '600', color: COLORS.textPrimary },
  size: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statusText: { ...TYPOGRAPHY.label },
});

export default PhotoStatusRow;
