/**
 * ESLint 8 (legacy `.eslintrc` format, the one ESLint 8 supports).
 *
 * `@react-native` is the base: it already wires the parsers for `.js`/`.jsx`
 * (Babel) and `.ts`/`.tsx` (typescript-eslint), the React, Hooks, React Native
 * and Jest plugins, and `eslint-config-prettier` so no stylistic rule fights
 * Prettier. Formatting itself is Prettier's job (`npm run format`).
 */

/** Path aliases — keep in sync with tsconfig.json and babel.config.js. */
const ALIASES = [
  'components',
  'config',
  'hooks',
  'navigation',
  'screens',
  'services',
  'storage',
  'utils',
];

module.exports = {
  root: true,
  extends: ['@react-native'],
  plugins: ['import'],
  settings: {
    // Lets `import/order` group alias imports as "internal".
    'import/internal-regex': `^@(${ALIASES.join('|')})(/|$)`,
  },
  rules: {
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/no-unstable-nested-components': 'warn',

    // Packages first, then aliases, then relative files; a blank line between groups.
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        // Type-aware linting without a separate tsconfig.eslint.json.
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      rules: {
        // TypeScript already reports unresolved and undefined names.
        'no-undef': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'separate-type-imports' },
        ],
        // Upload and storage work is async; an unhandled promise loses errors.
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { attributes: false } },
        ],
      },
    },
  ],
};
