import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Server, Smartphone } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { Outbox, ServerReports } from '@screens';

import { renderTabHeader } from './headers';

import type { MainTabParamList } from './types';
import type { LucideIcon } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = { color: string; focused: boolean };

/**
 * Tab icon with a soft red pill behind the active one (Material 3 style):
 * the current tab is obvious at a glance, not only by colour.
 */
const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, focused }: TabIconProps) =>
    (
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon
          size={SIZES.iconMd}
          color={color}
          strokeWidth={focused ? 2.4 : 2}
        />
      </View>
    );

/**
 * The icons carry the app's core distinction: a phone for "saved on this
 * phone" and a server for "on the server". The two are never mixed up.
 */
const OutboxIcon = tabIcon(Smartphone);
const ServerIcon = tabIcon(Server);

/** Tab bar height: 30dp icon pill + label + padding. */
const TAB_BAR_HEIGHT = 64;

/**
 * The two main screens, with a floating dark tab bar: rounded corners, red
 * icons, lifted above the system navigation bar. It stays in the layout (not
 * absolutely positioned), so lists and the FAB never slide under it.
 */

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Outbox"
      backBehavior="initialRoute"
      screenOptions={{
        header: renderTabHeader,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: [
          styles.tabBar,
          { height: TAB_BAR_HEIGHT, marginBottom: insets.bottom + SPACING.sm },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Outbox"
        component={Outbox}
        options={{
          title: 'Outbox',
          tabBarIcon: OutboxIcon,
          tabBarAccessibilityLabel: 'Outbox, reports on this phone',
        }}
      />
      <Tab.Screen
        name="ServerReports"
        component={ServerReports}
        options={{
          title: 'Reports on the server',
          tabBarLabel: 'On server',
          tabBarIcon: ServerIcon,
          tabBarAccessibilityLabel: 'On server, reports the server holds',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  scene: { backgroundColor: COLORS.background },
  tabBar: {
    marginHorizontal: SPACING.lg,
    paddingBottom: 0,
    borderRadius: 22,
    borderTopWidth: 0,
    backgroundColor: COLORS.tabBar,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  tabItem: { paddingVertical: 6 },
  tabLabel: { ...TYPOGRAPHY.label, marginTop: 2 },
  iconPill: {
    width: 56,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: COLORS.tabActiveTint },
});

export default MainTabs;
