import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat config (ESLint 10). Replaces the legacy `.eslintrc.cjs`, which pinned the
 * toolchain to ESLint 8 — end-of-life, and the reason its dependency chain kept
 * dragging in `brace-expansion@1.x`, a line that receives no security patches.
 *
 * Type-aware rules (no-floating-promises, strict-boolean-expressions, …) need
 * `parserOptions.project`, so the tsconfig must cover every linted path. It does:
 * its `include` is `['src/**', 'tests/**']`, matching the globs `npm run lint` passes.
 */
export default defineConfig([
  globalIgnores([
    'node_modules/',
    'dist/',
    'coverage/',
    'docs/tracelog.js',
    '**/*.config.js',
    '**/*.config.cjs',
    '**/*.config.mjs',
    'tsup.config.ts',
    'playwright.config.ts',
    'vitest.config.ts',
    'vitest.integration.config.ts',
    'scripts/**/*',
  ]),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettierRecommended],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
      '@typescript-eslint/no-meaningless-void-operator': 'warn',
      '@typescript-eslint/prefer-return-this-type': 'warn',
      '@typescript-eslint/no-invalid-this': 'error',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
    },
  },
]);
