import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src_v2/public-api.ts'),
      name: 'TraceLog',
      fileName: 'tracelog',
      formats: ['es', 'umd', 'iife']
    },
    outDir: 'dist_v2/browser',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src_v2')
    }
  }
});