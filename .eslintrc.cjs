module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/prefer-for-of': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',

    // ✅ Prevent async/await misuse - Catches the exact problem we fixed
    '@typescript-eslint/require-await': 'error',                    // Error if async function doesn't use await
    '@typescript-eslint/no-floating-promises': 'error',             // Error if Promise not handled
    '@typescript-eslint/no-misused-promises': 'error',              // Error if Promise used incorrectly (e.g., in conditionals)
    '@typescript-eslint/promise-function-async': 'error',           // Error if function returns Promise but not async
    '@typescript-eslint/await-thenable': 'error',                   // Error if awaiting non-Promise (our exact case!)
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',     // Warn on unnecessary type assertions
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs',
    '.eslintrc.cjs',
    'playwright.config.ts',
    'vite.config.mjs',
    'vitest.config.ts',
    'vitest.integration.config.ts',
    'scripts/**/*',
  ],
};
