import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@components';
import { COLORS, REPORT_LIMITS } from '@config';

/** Placeholder: the report form (description + photos) comes next. */
const CreateReport = () => (
  <Screen scroll>
    <Text style={styles.title}>Create a field report</Text>
    <Text style={styles.intro}>
      Describe what you found and add {REPORT_LIMITS.minImages}–
      {REPORT_LIMITS.maxImages} photos. Reports are saved on this device first,
      then uploaded when a connection is available.
    </Text>

    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>
        The report form will appear here.
      </Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  intro: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  placeholder: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CreateReport;
