import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest-setup.ts', './tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: false,
      },
    },
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
        pretendToBeVisual: false,
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.types.ts',
        'src/constants/**',
        'src/types/**',
        'src/public-api.ts',
        'src/test-bridge.ts',
        'src/**/index.ts',
        'src/app.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
