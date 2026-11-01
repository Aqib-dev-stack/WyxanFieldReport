import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Route definitions: one bottom tab navigator with the three main screens.
 *
 * Only routes whose screens exist are declared: a route without a matching
 * `<Screen>` would type-check but crash at runtime.
 */
export type MainTabParamList = {
  /** Description plus 1–5 photos, submitted into the local upload queue. */
  CreateReport: undefined;
  /** Reports saved on this device and waiting for (or failing) upload. */
  UploadQueue: undefined;
  /** Reports that exist on the backend. Separate from the local queue. */
  ServerReports: undefined;
};

/**
 * Screen prop helper — use it instead of hand-writing navigation types.
 *
 *   const UploadQueue = ({ navigation }: MainTabScreenProps<'UploadQueue'>) => …
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

/**
 * Makes `useNavigation()` default to the tab param list, so untyped calls are
 * still checked. See https://reactnavigation.org/docs/typescript
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainTabParamList {}
  }
}
