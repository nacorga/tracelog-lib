import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite Build Configuration for the Shopify Web Pixel Extension Bundle
 *
 * Produces a self-contained IIFE bundle for the Shopify Web Pixel Extension
 * (Task 07): no runtime deps, target ES2020, terser-minified.
 *
 * Output:
 *   dist/browser/tracelog-shopify-pixel.iife.js
 *
 * Size budget: <5KB minified+gzipped. Verify with:
 *   gzip -c dist/browser/tracelog-shopify-pixel.iife.js | wc -c
 */
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/pixel/index.ts'),
      name: 'TraceLogShopifyPixel',
      formats: ['iife'],
      fileName: () => 'tracelog-shopify-pixel.iife.js',
    },
    rollupOptions: {
      external: [],
    },
    outDir: 'dist/browser',
    emptyOutDir: false,
    target: 'es2020',
    minify: 'terser',
    sourcemap: 'hidden',
  },
});
