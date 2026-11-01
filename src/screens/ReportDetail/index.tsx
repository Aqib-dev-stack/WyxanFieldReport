import { StyleSheet, Text } from 'react-native';

import { Screen } from '@components';
import { COLORS, TYPOGRAPHY } from '@config';

import type { RootStackScreenProps } from '@navigation/types';

/** Placeholder until UI Step 4: description, photos and upload status. */
const ReportDetail = ({ route }: RootStackScreenProps<'ReportDetail'>) => (
  <Screen scroll>
    <Text style={styles.text}>Report {route.params.reportId}</Text>
  </Screen>
);

const styles = StyleSheet.create({
  text: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
});

export default ReportDetail;
