/* eslint-env jest */

// Safe-area insets come from native code; use the library's Jest stand-in.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// NetInfo is a native module; use the library's Jest mock.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// op-sqlite is native; swap in a real in-memory SQLite (node:sqlite).
jest.mock('@op-engineering/op-sqlite', () => require('./jest/opSqliteMock'));
