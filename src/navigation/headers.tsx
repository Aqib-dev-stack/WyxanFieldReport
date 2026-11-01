import { AppHeader } from '@components';

import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';

/**
 * Adapters from each navigator's header props to `AppHeader`. Defined at
 * module level (not inline in `screenOptions`) so React sees one stable
 * component type and doesn't remount the header on every render.
 */

const titleOf = (title: unknown, fallback: string): string =>
  typeof title === 'string' ? title : fallback;

/** Main tabs: no back button; settings is reachable from here. */
export const renderTabHeader = ({
  navigation,
  options,
  route,
}: BottomTabHeaderProps) => (
  <AppHeader
    title={titleOf(options.title, route.name)}
    onOpenSettings={() => navigation.navigate('Settings')}
  />
);

/** Stack screens above the tabs: back button, no settings shortcut. */
export const renderStackHeader = ({
  navigation,
  options,
  route,
  back,
}: NativeStackHeaderProps) => (
  <AppHeader
    title={titleOf(options.title, route.name)}
    onBack={back ? navigation.goBack : undefined}
  />
);
