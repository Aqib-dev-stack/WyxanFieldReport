module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Drizzle migrations are .sql files; inline them as strings at build time.
    ['inline-import', { extensions: ['.sql'] }],
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
          '@db': './src/db',
          '@hooks': './src/hooks',
          '@mocks': './src/mocks',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
