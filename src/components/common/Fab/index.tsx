import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import type { ReactNode } from 'react';

export type FabProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

export const FAB_HEIGHT = 56;

/**
 * Extended floating action button: brand ink with the icon in a brand-red
 * circle, plus a text label, so the main action is obvious without
 * guessing what an icon means. The parent positions it.
 */
const Fab = ({ label, icon, onPress }: FabProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    android_ripple={{ color: COLORS.primaryPressed }}
    style={({ pressed }) => [styles.base, pressed && styles.pressed]}
  >
    <View style={styles.iconCircle}>{icon}</View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    height: FAB_HEIGHT,
    minWidth: SIZES.hitTarget,
    paddingLeft: SPACING.sm + SPACING.xxs,
    paddingRight: SPACING.xl,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    // Android elevation + iOS shadow.
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { backgroundColor: COLORS.primaryPressed },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  label: { ...TYPOGRAPHY.headline, color: COLORS.onPrimary },
});

export default Fab;
