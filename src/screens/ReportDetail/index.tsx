import { FileQuestion } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  EmptyState,
  PhotoStatusRow,
  ReportStatusCard,
  Screen,
} from '@components';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@config';
import { useReportDetail } from '@hooks/useReportDetail';
import { formatPhotoCount, formatRelativeTime } from '@utils/formatters';
import { getPhotoDisplayStatus } from '@utils/reportStatus';

import type { RootStackScreenProps } from '@navigation/types';
import type { ReactNode } from 'react';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow} accessible>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} selectable>
      {value}
    </Text>
  </View>
);

/**
 * One report on this phone: its status and what it means, the full
 * description, each photo with its own status, and technical details.
 * Stays live while open, so progress keeps moving.
 */
const ReportDetail = ({
  route,
  navigation,
}: RootStackScreenProps<'ReportDetail'>) => {
  const { item, retry } = useReportDetail(route.params.reportId);

  if (!item) {
    return (
      <Screen>
        <EmptyState
          icon={<FileQuestion size={48} color={COLORS.textDisabled} />}
          title="Report not found"
          message="It is no longer on this phone. It may have been removed with Start over."
          action={
            <AppButton
              title="Back to Outbox"
              onPress={() => navigation.popTo('MainTabs', { screen: 'Outbox' })}
            />
          }
        />
      </Screen>
    );
  }

  const { report } = item;
  const photos = [...report.images].sort((a, b) => a.position - b.position);

  return (
    <Screen scroll padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <ReportStatusCard item={item} onRetry={retry} />

        <Section title="Description">
          <Text style={styles.description} selectable>
            {report.description}
          </Text>
        </Section>

        <Section title={`Photos · ${photos.length}`}>
          {photos.map(image => (
            <PhotoStatusRow
              key={image.id}
              image={image}
              displayStatus={getPhotoDisplayStatus(report, image)}
            />
          ))}
        </Section>

        <Section title="Details">
          <DetailRow
            label="Created"
            value={formatRelativeTime(report.createdAt)}
          />
          <DetailRow label="Photos" value={formatPhotoCount(photos.length)} />
          <DetailRow
            label="Upload attempts"
            value={String(report.attemptCount)}
          />
          {/* The client-made ID is also the server key: retries can't duplicate. */}
          <DetailRow label="Report ID" value={report.id} />
        </Section>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.xl },
  section: { gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  card: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  description: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  detailLabel: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
});

export default ReportDetail;
