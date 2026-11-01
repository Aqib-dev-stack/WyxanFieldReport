import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';

export type DevScenarioSwitcherProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * UI phase, development builds only: previews a screen's states (loading,
 * empty, error, offline) without a backend. The caller renders it only when
 * `__DEV__` is true, so it never ships in a release build.
 */
const DevScenarioSwitcher = <T extends string>({
  label,
  options,
  value,
  onChange,
}: DevScenarioSwitcherProps<T>) => (
  <View style={styles.bar}>
    <Text style={styles.label}>{label}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.options}
    >
      {options.map(option => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Preview ${option}`}
            onPress={() => onChange(option)}
            style={styles.chip}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: SPACING.lg,
    backgroundColor: '#FFF7D6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6D48A',
  },
  label: { ...TYPOGRAPHY.caption, fontWeight: '700', color: '#6B5900' },
  options: { gap: SPACING.xs, paddingRight: SPACING.lg },
  chip: {
    minHeight: SIZES.hitTarget,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  chipText: { ...TYPOGRAPHY.label, color: '#6B5900' },
  chipTextSelected: {
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
});

export default DevScenarioSwitcher;
