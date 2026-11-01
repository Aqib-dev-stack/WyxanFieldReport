module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // These packages ship untranspiled ESM and must go through Babel too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?' +
      '|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
