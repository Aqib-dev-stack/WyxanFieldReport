/* eslint-env jest */

// Safe-area insets come from native code; use the library's Jest stand-in.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
