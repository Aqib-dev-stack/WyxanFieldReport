module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The backend is a separate package with its own tests (node --test).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backend/'],
  // lucide's "react-native" export is an .mjs file, which babel-jest does not
  // transform. Its CommonJS build is the same icons.
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  // These packages ship untranspiled ESM and must go through Babel too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?' +
      '|@react-navigation|react-native-screens|react-native-safe-area-context' +
      '|react-native-svg|lucide-react-native)/)',
  ],
};
