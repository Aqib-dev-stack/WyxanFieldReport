/**
 * @format
 */

// Must be first: gives Hermes a secure crypto.getRandomValues for report IDs.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
