import { CloudOff, Server, ServerCrash } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  DevScenarioSwitcher,
  EmptyState,
  Screen,
  ServerReportCard,
  ServerReportSkeleton,
} from '@components';
import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { useServerReports } from '@hooks/useServerReports';
import { getServerScenario, SERVER_SCENARIOS, setServerScenario } from '@mocks';
import { formatRelativeTime } from '@utils/formatters';
import { describeApiError } from '@utils/serverReports';

import type { ServerReport } from '@app-types';
import type { ServerScenario } from '@mocks';
import type { MainTabScreenProps } from '@navigation/types';

const keyExtractor = (report: ServerReport) => report.id;
const renderItem = ({ item }: { item: ServerReport }) => (
  <ServerReportCard report={item} />
);
const Separator = () => <View style={styles.separator} />;

const BIG_ICON = 48;

/**
 * What the server holds, fetched from the server (never from local state).
 * Loading, list, empty, error and offline are each designed states; a failed
 * refresh keeps the last list and says how old it is.
 */
const ServerReports = ({ navigation }: MainTabScreenProps<'ServerReports'>) => {
  const { state, isRefreshing, refresh, retry, reload } = useServerReports();
  const [scenario, setScenario] = useState<ServerScenario>(getServerScenario);

  const onScenarioChange = useCallback(
    (next: ServerScenario) => {
      setServerScenario(next);
      setScenario(next);
      reload();
    },
    [reload],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={refresh}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  );

  const renderBody = () => {
    if (state.status === 'loading') {
      return (
        <ScrollView contentContainerStyle={styles.padded}>
          <Text style={styles.caption}>Checking the server…</Text>
          <ServerReportSkeleton />
        </ScrollView>
      );
    }

    if (state.status === 'error') {
      const offline = state.error.kind === 'offline';
      return (
        <ScrollView
          contentContainerStyle={styles.grow}
          refreshControl={refreshControl}
        >
          <EmptyState
            icon={
              offline ? (
                <CloudOff size={BIG_ICON} color={COLORS.networkOffline} />
              ) : (
                <ServerCrash size={BIG_ICON} color={COLORS.danger} />
              )
            }
            title={
              offline
                ? "You're offline"
                : "Couldn't load reports from the server"
            }
            message={
              offline
                ? 'This list comes from the server, so it needs a connection. Reports on this phone are safe and will upload automatically.'
                : `${describeApiError(
                    state.error,
                  )} Reports on this phone are not affected.`
            }
            action={<AppButton title="Try again" onPress={retry} />}
          />
        </ScrollView>
      );
    }

    if (state.reports.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.grow}
          refreshControl={refreshControl}
        >
          <EmptyState
            icon={<Server size={BIG_ICON} color={COLORS.textDisabled} />}
            title="No reports on the server yet"
            message="Reports appear here once they have fully uploaded. Reports still on this phone are in the Outbox."
            action={
              <AppButton
                title="Go to Outbox"
                variant="secondary"
                onPress={() => navigation.navigate('Outbox')}
              />
            }
          />
        </ScrollView>
      );
    }

    const updated = formatRelativeTime(state.fetchedAt);
    return (
      <FlatList
        data={state.reports}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.padded}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {state.refreshError ? (
              <View style={styles.notice} accessibilityRole="alert">
                <Text style={styles.noticeText}>
                  {state.refreshError.kind === 'offline'
                    ? "You're offline."
                    : "Couldn't refresh."}{' '}
                  Showing the list from {updated.toLowerCase()}.
                </Text>
                <AppButton
                  title="Retry"
                  variant="secondary"
                  onPress={retry}
                  style={styles.noticeButton}
                />
              </View>
            ) : null}
            <Text style={styles.caption}>
              {state.reports.length}{' '}
              {state.reports.length === 1 ? 'report' : 'reports'} · Updated{' '}
              {updated.toLowerCase()} · Pull down to refresh
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <Screen padded={false}>
      {__DEV__ ? (
        <DevScenarioSwitcher
          label="DEV"
          options={SERVER_SCENARIOS}
          value={scenario}
          onChange={onScenarioChange}
        />
      ) : null}
      {renderBody()}
    </Screen>
  );
};

const styles = StyleSheet.create({
  padded: { padding: SPACING.lg, gap: SPACING.md },
  grow: { flexGrow: 1 },
  separator: { height: SPACING.md },
  listHeader: { gap: SPACING.md, marginBottom: SPACING.xs },
  caption: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  noticeText: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.textPrimary },
  noticeButton: { minWidth: SIZES.hitTarget * 2 },
});

export default ServerReports;
