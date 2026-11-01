import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { COLORS } from '@config';
import { CreateReport, ServerReports, UploadQueue } from '@screens';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * The three main screens. Rendered inside `NavigationContainer` (see App.tsx).
 * The tab bar pads itself for the Android navigation bar / home indicator
 * (safe-area insets), so screens only pad their sides. Tabs have text labels
 * only until an icon set is chosen.
 */
const AppNavigator = () => (
  <Tab.Navigator
    initialRouteName="CreateReport"
    backBehavior="initialRoute"
    screenOptions={{
      headerTitleAlign: 'left',
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerShadowVisible: false,
      sceneStyle: styles.scene,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.tabInactive,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIconStyle: styles.hidden,
      tabBarLabelPosition: 'below-icon',
    }}
  >
    <Tab.Screen
      name="CreateReport"
      component={CreateReport}
      options={{ title: 'New Report', tabBarLabel: 'New Report' }}
    />
    <Tab.Screen
      name="UploadQueue"
      component={UploadQueue}
      options={{ title: 'Upload Queue', tabBarLabel: 'Queue' }}
    />
    <Tab.Screen
      name="ServerReports"
      component={ServerReports}
      options={{ title: 'Server Reports', tabBarLabel: 'Server' }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  scene: { backgroundColor: COLORS.background },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  hidden: { display: 'none' },
});

export default AppNavigator;
