import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Server, Smartphone } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { COLORS, SIZES, TYPOGRAPHY } from '@config';
import { Outbox, ServerReports } from '@screens';

import { renderTabHeader } from './headers';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = { color: string };

/**
 * The icons carry the app's core distinction: a phone for "saved on this
 * phone" and a server for "on the server". The two are never mixed up.
 */
const OutboxIcon = ({ color }: TabIconProps) => (
  <Smartphone size={SIZES.iconMd} color={color} />
);
const ServerIcon = ({ color }: TabIconProps) => (
  <Server size={SIZES.iconMd} color={color} />
);

/**
 * The two main screens. The tab bar pads itself for the Android navigation
 * bar (safe-area insets), so screens only pad their sides.
 */
const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Outbox"
    backBehavior="initialRoute"
    screenOptions={{
      header: renderTabHeader,
      sceneStyle: styles.scene,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.tabInactive,
      tabBarStyle: styles.tabBar,
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

const styles = StyleSheet.create({
  scene: { backgroundColor: COLORS.background },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
  },
  tabLabel: { ...TYPOGRAPHY.label },
});

export default MainTabs;
