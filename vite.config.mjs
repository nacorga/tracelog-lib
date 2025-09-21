import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      ['playground', 'e2e'].includes(process.env.NODE_ENV) ? process.env.NODE_ENV : 'production'
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
    minify: !['playground', 'e2e'].includes(process.env.NODE_ENV),
    sourcemap: ['playground', 'e2e'].includes(process.env.NODE_ENV),
  },
});