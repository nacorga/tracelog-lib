import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/public-api.ts'),
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