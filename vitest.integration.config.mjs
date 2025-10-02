import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    include: ['tests/integration/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000,
    teardownTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage-integration',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'tests/**/*',
        'playground/**/*',
        'dist/**/*',
        'scripts/**/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
