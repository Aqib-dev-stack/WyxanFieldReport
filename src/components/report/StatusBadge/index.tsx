import { StyleSheet, Text, View } from 'react-native';

import { RADIUS, SIZES, SPACING, STATUS_APPEARANCE, TYPOGRAPHY } from '@config';
import { getStatusText } from '@utils/reportStatus';

import type { ReportStatus, UploadProgress } from '@app-types';

export type StatusBadgeProps = {
  status: ReportStatus;
  progress?: UploadProgress | null;
};

/** Icon + words + colour for one status. Wraps instead of truncating. */
const StatusBadge = ({ status, progress = null }: StatusBadgeProps) => {
  const { icon: Icon, color, tint } = STATUS_APPEARANCE[status];

  return (
    <View style={[styles.badge, { backgroundColor: tint }]}>
      <Icon size={SIZES.iconSm} color={color} />
      <Text style={[styles.text, { color }]}>
        {getStatusText(status, progress)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + SPACING.xxs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    maxWidth: '100%',
  },
  text: { ...TYPOGRAPHY.label, flexShrink: 1 },
});

export default StatusBadge;
