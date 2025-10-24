import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest-setup.ts', './tests/setup.ts'],
    include: ['tests/integration/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    silent: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
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
        'src/**/*.types.ts',
        'src/types/**',
        'src/test-bridge.ts',
        'src/**/index.ts',
        'tests/**/*',
        'playground/**/*',
        'dist/**/*',
        'scripts/**/*',
      ],
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
