import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@navigation';

/**
 * Root providers only. Android draws edge to edge (`edgeToEdgeEnabled`), so
 * the status bar is transparent and the headers and tab bar pad themselves
 * with safe-area insets. Navigation lives in src/navigation.
 */
const App = () => (
  <SafeAreaProvider>
    <StatusBar barStyle="dark-content" />
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </SafeAreaProvider>
);

export default App;
