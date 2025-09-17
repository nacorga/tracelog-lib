import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV === 'e2e' ? 'e2e' : 'production'
    ),
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
    minify: process.env.NODE_ENV !== 'e2e',
    sourcemap: process.env.NODE_ENV === 'e2e',
  },
});