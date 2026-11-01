import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING } from '@config';

import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

export type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BACKGROUND: Record<Variant, string> = {
  primary: COLORS.primary,
  secondary: COLORS.surface,
  danger: COLORS.danger,
};

const AppButton = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: AppButtonProps) => {
  const isDisabled = disabled || loading;
  const textColor = variant === 'secondary' ? COLORS.primary : COLORS.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      android_ripple={{ color: COLORS.ripple }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BACKGROUND[variant] },
        variant === 'secondary' && styles.outlined,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: SIZES.hitTarget,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.primary,
  },
  title: { fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});

export default AppButton;
