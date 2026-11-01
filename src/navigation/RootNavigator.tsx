import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { COLORS } from '@config';
import { Compose, ReportDetail, Settings } from '@screens';

import { renderStackHeader } from './headers';
import MainTabs from './MainTabs';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root of the app, rendered inside `NavigationContainer` (see App.tsx).
 * The tabs are the first screen; Compose, ReportDetail and Settings are
 * pushed on top of them with a back button.
 */
const RootNavigator = () => (
  <Stack.Navigator
    initialRouteName="MainTabs"
    screenOptions={{
      header: renderStackHeader,
      contentStyle: styles.content,
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={MainTabs}
      // The tabs draw their own header (with the settings button).
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Compose"
      component={Compose}
      options={{ title: 'New report' }}
    />
    <Stack.Screen
      name="ReportDetail"
      component={ReportDetail}
      options={{ title: 'Report' }}
    />
    <Stack.Screen
      name="Settings"
      component={Settings}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  content: { backgroundColor: COLORS.background },
});

export default RootNavigator;
