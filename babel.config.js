module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Path aliases — keep in sync with `paths` in tsconfig.json.
    // Babel resolves them for both Metro and Jest.
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
        ],
        alias: {
          // Not `@types`: that is npm's scope for type packages.
          '@app-types': './src/types',
          '@components': './src/components',
          '@config': './src/config',
          '@hooks': './src/hooks',
          '@mocks': './src/mocks',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@services': './src/services',
          '@storage': './src/storage',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
