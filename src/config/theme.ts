import type { TextStyle } from 'react-native';

/** 4dp grid. Use these for padding, margins and gaps. */
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const SIZES = {
  /** Minimum touch target (Material 48dp; above the 44dp floor in the brief). */
  hitTarget: 48,
  /** Header content height, excluding the status-bar inset. */
  headerHeight: 56,
  iconSm: 16,
  iconMd: 22,
  iconLg: 28,
} as const;

/**
 * Type scale on the system font. Sizes are in sp, so they follow the user's
 * font-size setting; layouts must not assume a fixed text height.
 */
export const TYPOGRAPHY = {
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;
