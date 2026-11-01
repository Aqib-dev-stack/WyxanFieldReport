const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * `.sql` is a source extension so Drizzle's migration files are bundled; the
 * `inline-import` Babel plugin turns each one into a string.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'sql'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
