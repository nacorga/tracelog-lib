import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/public-api.ts'),
      name: 'TraceLog',
      fileName: 'tracelog',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        entryFileNames: 'tracelog.js',
        dir: 'dist/browser',
      },
    },
    target: 'es2022',
    minify: false,
    sourcemap: true,
  },
}); 