import { RotateCcw } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import {
  COLORS,
  RADIUS,
  SIZES,
  SPACING,
  STATUS_APPEARANCE,
  TYPOGRAPHY,
} from '@config';
import { getStatusExplanation } from '@utils/reportStatus';

import AppButton from '../../common/AppButton';
import ProgressBar from '../../common/ProgressBar';
import StatusBadge from '../StatusBadge';

import type { OutboxItem } from '@app-types';

export type ReportStatusCardProps = {
  item: OutboxItem;
  onRetry: () => void;
};

/**
 * Top of Report detail: where the report is, what that means, and, when it
 * failed, why and what the user can do about it.
 */
const ReportStatusCard = ({ item, onRetry }: ReportStatusCardProps) => {
  const { report, progress } = item;
  const appearance = STATUS_APPEARANCE[report.status];
  const isFailed = report.status === 'failed';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: appearance.tint, borderColor: appearance.color },
      ]}
    >
      <StatusBadge status={report.status} progress={progress} />

      {progress ? (
        <ProgressBar
          progress={progress.fraction}
          color={appearance.color}
          accessibilityLabel="Upload progress"
        />
      ) : null}

      <Text style={styles.explanation}>
        {getStatusExplanation(report.status)}
      </Text>

      {isFailed ? (
        <>
          {report.lastError ? (
            <View style={styles.reason}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>{report.lastError}</Text>
            </View>
          ) : null}
          <AppButton
            title="Try again"
            onPress={onRetry}
            accessibilityHint="Puts this report back in the upload queue"
            icon={
              <RotateCcw size={SIZES.iconSm + 2} color={COLORS.onPrimary} />
            }
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
  },
  explanation: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  reason: {
    gap: SPACING.xxs,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  reasonLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  reasonText: { ...TYPOGRAPHY.body, color: STATUS_APPEARANCE.failed.color },
});

export default ReportStatusCard;
