/**
 * Colour palette, from the WYXAN brand (wyxan.com: red rgb(195, 39, 46) on
 * near-black). Components use these names, never raw hex values. Contrast is
 * kept high on purpose: the app is used outdoors, often in direct sunlight.
 *
 * Brand red is an ACCENT (logo, active tab, splash), not the button colour:
 * in this app red also means "upload failed" and "delete", and a red "Save"
 * button would blur that. Primary actions use the brand's near-black ink.
 */
export const COLORS = {
  brand: '#C3272E',
  brandPressed: '#A11F25',
  /** Soft brand tint behind the active tab icon. */
  brandTint: '#FBE9EA',

  /** Primary actions (buttons, FAB): the brand's near-black ink. */
  primary: '#0E0F12',
  primaryPressed: '#2A2D34',
  onPrimary: '#FFFFFF',

  /** Header and splash: dark, like wyxan.com. */
  header: '#0E0F12',
  onHeader: '#FFFFFF',
  onHeaderMuted: 'rgba(255, 255, 255, 0.64)',
  headerPressed: 'rgba(255, 255, 255, 0.14)',

  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F3',
  border: '#E2E5EA',
  /** Android ripple / pressed overlay on light surfaces. */
  ripple: '#E2E5EA',

  textPrimary: '#14171C',
  textSecondary: '#5B6370',
  textDisabled: '#9AA1AC',

  success: '#2E7D4F',
  warning: '#B26A00',
  danger: '#B3261E',

  /** Network indicator on the dark header. */
  networkOnline: '#3DDC84',
  /** Offline: dark icon + label on a light pill (readable on the dark header). */
  networkOffline: '#2B333D',
  networkOfflinePill: '#F1F2F4',

  /** Bottom tab bar: a dark, rounded bar with red icons. */
  tabBar: '#0E0F12',
  tabActive: '#E5484D',
  tabActiveTint: 'rgba(229, 72, 77, 0.16)',
  tabInactive: '#9AA1AC',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof COLORS;
