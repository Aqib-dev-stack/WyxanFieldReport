import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING } from '@config';

import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerOutline';

export type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  /** Optional icon before the title; colour it to match the variant. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const LOOK: Record<
  Variant,
  { background: string; pressed: string; text: string; border?: string }
> = {
  // Brand ink, like wyxan.com's buttons. Not red: red means failure here.
  primary: {
    background: COLORS.primary,
    pressed: COLORS.primaryPressed,
    text: COLORS.onPrimary,
  },
  secondary: {
    background: COLORS.surface,
    pressed: COLORS.surfaceMuted,
    text: COLORS.textPrimary,
    border: COLORS.border,
  },
  danger: {
    background: COLORS.danger,
    pressed: '#8C1D18',
    text: COLORS.onPrimary,
  },
  // A destructive action that is not the next step on the screen: visible,
  // but calm. The final, irreversible confirm uses the filled `danger`.
  dangerOutline: {
    background: COLORS.surface,
    pressed: '#FBEAEA',
    text: COLORS.danger,
    border: COLORS.danger,
  },
};

/** The app's button: 52dp tall (above the 48dp touch minimum), full feedback. */
const AppButton = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: AppButtonProps) => {
  const isDisabled = disabled || loading;
  const look = LOOK[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      android_ripple={{ color: look.pressed }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? look.pressed : look.background },
        look.border ? { borderWidth: 1, borderColor: look.border } : null,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={look.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.title, { color: look.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: SIZES.hitTarget + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md + 2,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: { opacity: 0.4 },
});

export default AppButton;
