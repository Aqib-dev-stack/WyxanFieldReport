/**
 * Web Crypto's random source. Provided on the phone by
 * `react-native-get-random-values` (imported first in index.js) and by Node
 * in Jest. React Native's types don't declare it.
 */
declare const crypto: {
  getRandomValues<T extends Uint8Array>(array: T): T;
};
