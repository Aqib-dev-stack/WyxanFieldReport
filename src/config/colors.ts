export const COLORS = {
  primary: '#1F5FAD',
  primaryPressed: '#184C8A',
  onPrimary: '#FFFFFF',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#DDE3EA',

  textPrimary: '#14202E',
  textSecondary: '#5B6878',
  textDisabled: '#9AA5B1',

  success: '#2E7D4F',
  warning: '#B26A00',
  danger: '#C62828',

  tabInactive: '#7A8693',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof COLORS;
