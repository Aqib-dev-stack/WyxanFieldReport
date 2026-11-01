import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Route map:
 *
 *   RootStack (native stack)
 *     MainTabs (bottom tabs)
 *       Outbox          reports saved on this phone, and their upload state
 *       ServerReports   reports the server holds ("On server")
 *     Compose           new report form, pushed over the tabs
 *     ReportDetail      one local report
 *     Settings          opened from the header; holds "Start over"
 *
 * Compose and ReportDetail sit above the tabs so the tab bar is hidden while
 * the user is filling a form or reading one report.
 */
export type MainTabParamList = {
  Outbox: undefined;
  ServerReports: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Compose: undefined;
  /** `reportId` is the client-generated UUID, also the server key. */
  ReportDetail: { reportId: string };
  Settings: undefined;
};

/**
 * Screen prop helpers — use them instead of hand-writing navigation types.
 *
 *   const Compose = ({ navigation }: RootStackScreenProps<'Compose'>) => …
 *   const Outbox = ({ navigation }: MainTabScreenProps<'Outbox'>) => …
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** Tab screens can also navigate to stack routes (e.g. Outbox → Compose). */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

/**
 * Makes `useNavigation()` default to the root param list, so untyped calls
 * are still checked. See https://reactnavigation.org/docs/typescript
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
