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

    // ✅ Prevention of logical bugs
    '@typescript-eslint/no-unnecessary-condition': 'warn',          // Detect conditions always true/false
    '@typescript-eslint/switch-exhaustiveness-check': 'error',      // Ensure complete switch statements with enums
    '@typescript-eslint/no-confusing-void-expression': 'warn',      // Prevent confusing void usage

    // ✅ Code quality improvements
    '@typescript-eslint/strict-boolean-expressions': 'warn',        // Force explicit booleans in conditions
    '@typescript-eslint/prefer-reduce-type-parameter': 'warn',      // Improve type inference in Array.reduce()
    '@typescript-eslint/no-meaningless-void-operator': 'warn',      // Detect unnecessary void operators
    '@typescript-eslint/prefer-return-this-type': 'warn',           // Improve method chaining in classes

    // ✅ Architecture-specific (StateManager/EventManager patterns)
    '@typescript-eslint/no-invalid-this': 'error',                  // Prevent errors with this in arrow functions
    '@typescript-eslint/unbound-method': 'warn',                    // Detect methods without proper binding

    // ✅ Additional safety
    '@typescript-eslint/no-base-to-string': 'warn',                 // Prevent unwanted .toString() on objects
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
