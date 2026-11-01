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

// Native file system and image picker: in-memory / no-op stand-ins.
jest.mock('@dr.pogodin/react-native-fs', () => require('./jest/fsMock'));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));

// Native image resizer: never called in Jest (tests inject a fake compressor).
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  __esModule: true,
  default: { createResizedImage: jest.fn() },
}));
