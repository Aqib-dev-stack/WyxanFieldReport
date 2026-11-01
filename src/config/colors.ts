/**
 * Colour palette. Components use these names, never raw hex values, so the
 * palette can change in one place. Contrast is kept high on purpose: the app
 * is used outdoors, often in direct sunlight.
 */
export const COLORS = {
  primary: '#1F5FAD',
  primaryPressed: '#184C8A',
  onPrimary: '#FFFFFF',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  border: '#DDE3EA',
  /** Android ripple / pressed overlay on light surfaces. */
  ripple: '#DDE3EA',

  textPrimary: '#14202E',
  textSecondary: '#5B6878',
  textDisabled: '#9AA5B1',

  success: '#2E7D4F',
  warning: '#B26A00',
  danger: '#C62828',

  /** Header network indicator. Offline is dark, not red: being offline is normal here, not an error. */
  networkOnline: '#1E8E4E',
  networkOffline: '#2B333D',

  tabInactive: '#7A8693',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof COLORS;
