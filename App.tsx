import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseGate, ToastProvider } from '@components';
import { RootNavigator } from '@navigation';

/**
 * Root providers only. Android draws edge to edge (`edgeToEdgeEnabled`), so
 * the status bar is transparent and the headers and tab bar pad themselves
 * with safe-area insets. Navigation lives in src/navigation. Nothing below
 * DatabaseGate renders until the database is open and migrated.
 */
const App = () => (
  <SafeAreaProvider>
    <StatusBar barStyle="dark-content" />
    <ToastProvider>
      <DatabaseGate>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </DatabaseGate>
    </ToastProvider>
  </SafeAreaProvider>
);

export default App;
