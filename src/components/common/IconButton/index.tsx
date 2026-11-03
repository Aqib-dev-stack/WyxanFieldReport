import { Pressable, StyleSheet } from 'react-native';

import { COLORS, RADIUS, SIZES } from '@config';

import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

export type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** The icon element, e.g. `<Settings />` from lucide-react-native. */
  icon: ReactNode;
  /** Required: an icon-only button has no visible text for screen readers. */
  accessibilityLabel: string;
  /** Pressed feedback; pass a light one on dark surfaces. */
  rippleColor?: string;
};

/** Icon-only button with a full 48dp touch target, whatever the icon size. */
const IconButton = ({
  icon,
  rippleColor = COLORS.ripple,
  ...rest
}: IconButtonProps) => (
  <Pressable
    accessibilityRole="button"
    android_ripple={{ color: rippleColor, borderless: true }}
    style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    {...rest}
  >
    {icon}
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    width: SIZES.hitTarget,
    height: SIZES.hitTarget,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});

export default IconButton;
