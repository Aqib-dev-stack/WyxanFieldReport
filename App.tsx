import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseGate, ToastProvider } from '@components';
import { COLORS } from '@config';
import { RootNavigator } from '@navigation';

/** The background around the floating tab bar matches the screens'. */
const THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.background },
};

/**
 * Root providers only. Android draws edge to edge (`edgeToEdgeEnabled`), so
 * the status bar is transparent and the headers and tab bar pad themselves
 * with safe-area insets. Navigation lives in src/navigation. Nothing below
 * DatabaseGate renders until the database is open and migrated.
 */
const App = () => (
  <SafeAreaProvider>
    {/* Light icons: the header and the splash are dark (WYXAN ink). */}
    <StatusBar barStyle="light-content" />
    <ToastProvider>
      <DatabaseGate>
        <NavigationContainer theme={THEME}>
          <RootNavigator />
        </NavigationContainer>
      </DatabaseGate>
    </ToastProvider>
  </SafeAreaProvider>
);

export default App;
