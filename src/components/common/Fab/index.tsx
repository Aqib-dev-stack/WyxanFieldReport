import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import type { ReactNode } from 'react';

export type FabProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

export const FAB_HEIGHT = 56;

/**
 * Extended floating action button: icon plus a text label, so the main
 * action is obvious without guessing what an icon means. The parent
 * positions it.
 */
const Fab = ({ label, icon, onPress }: FabProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    android_ripple={{ color: COLORS.primaryPressed }}
    style={({ pressed }) => [styles.base, pressed && styles.pressed]}
  >
    {icon}
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    height: FAB_HEIGHT,
    minWidth: SIZES.hitTarget,
    paddingHorizontal: SPACING.lg + SPACING.xs,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    // Android elevation + iOS shadow.
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { backgroundColor: COLORS.primaryPressed },
  label: { ...TYPOGRAPHY.headline, color: COLORS.onPrimary },
});

export default Fab;
