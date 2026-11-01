import { Inbox, Plus } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  EmptyState,
  Fab,
  FAB_HEIGHT,
  OfflineBanner,
  ReportCard,
  Screen,
  SummaryStrip,
} from '@components';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { useOutboxReports } from '@hooks/useOutboxReports';
import { groupOutbox, summarizeOutbox } from '@utils/reportStatus';

import type { OutboxItem } from '@app-types';
import type { MainTabScreenProps } from '@navigation/types';
import type { OutboxSection } from '@utils/reportStatus';
import type { SectionListRenderItem } from 'react-native';

const keyExtractor = (item: OutboxItem) => item.report.id;

const renderSectionHeader = ({ section }: { section: OutboxSection }) => (
  <Text style={styles.sectionTitle} accessibilityRole="header">
    {`${section.title} · ${section.data.length}`}
  </Text>
);

/**
 * Home screen: every report saved on this phone and where it is in its trip
 * to the server. Top to bottom: offline banner (only when offline), summary
 * strip, then reports grouped by urgency.
 */
const Outbox = ({ navigation }: MainTabScreenProps<'Outbox'>) => {
  const items = useOutboxReports();
  const sections = useMemo(() => groupOutbox(items), [items]);
  const summary = useMemo(() => summarizeOutbox(items), [items]);

  const openCompose = useCallback(
    () => navigation.navigate('Compose'),
    [navigation],
  );
  const openReport = useCallback(
    (reportId: string) => navigation.navigate('ReportDetail', { reportId }),
    [navigation],
  );
  const renderItem = useCallback<
    SectionListRenderItem<OutboxItem, OutboxSection>
  >(
    ({ item }) => <ReportCard item={item} onPress={openReport} />,
    [openReport],
  );

  if (items.length === 0) {
    return (
      <Screen padded={false}>
        <OfflineBanner />
        <EmptyState
          icon={<Inbox size={48} color={COLORS.textDisabled} />}
          title="No reports yet"
          message="Reports you create are saved on this phone first, then uploaded automatically, even with a weak signal."
          action={<AppButton title="New report" onPress={openCompose} />}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <OfflineBanner />
      <SummaryStrip summary={summary} />
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
      />
      <View style={styles.fab}>
        <Fab
          label="New report"
          icon={<Plus size={SIZES.iconMd} color={COLORS.onPrimary} />}
          onPress={openCompose}
        />
      </View>
    </Screen>
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.lg,
    // Room for the FAB so it never covers the last card.
    paddingBottom: FAB_HEIGHT + SPACING.xl * 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  separator: { height: SPACING.md },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});

export default Outbox;
