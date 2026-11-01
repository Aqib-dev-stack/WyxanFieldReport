import { View, StyleSheet } from 'react-native';

import { AppButton, EmptyState, Screen } from '@components';
import { SPACING } from '@config';

import type { MainTabScreenProps } from '@navigation/types';

/**
 * Placeholder until UI Step 2 (report cards, summary strip, offline banner,
 * "New report" button). The sample-report button only proves the route works.
 */
const Outbox = ({ navigation }: MainTabScreenProps<'Outbox'>) => (
  <Screen>
    <EmptyState
      title="No reports yet"
      message="Reports you create are saved on this phone first, then uploaded automatically."
      action={
        <View style={styles.actions}>
          <AppButton
            title="New report"
            onPress={() => navigation.navigate('Compose')}
          />
          <AppButton
            title="Open a sample report"
            variant="secondary"
            onPress={() =>
              navigation.navigate('ReportDetail', { reportId: 'sample-report' })
            }
          />
        </View>
      }
    />
  </Screen>
);

const styles = StyleSheet.create({
  actions: { gap: SPACING.md },
});

export default Outbox;
