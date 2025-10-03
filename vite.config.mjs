import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite Build Configuration for Browser Bundles
 *
 * Generates two browser-compatible bundles:
 * - tracelog.js (IIFE) → Use with <script> tags, creates window.TraceLog.tracelog
 * - tracelog.esm.js (ESM) → Use with <script type="module"> and import statements
 */
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV === 'dev' ? process.env.NODE_ENV : 'production'
    ),
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/public-api.ts'),
      name: 'tracelog',
    },
    rollupOptions: {
      external: [],
      output: [
        {
          // IIFE format for traditional <script> tags
          // Creates: window.tracelog = { init, event, ... }
          format: 'iife',
          name: 'TraceLog',
          entryFileNames: 'tracelog.js',
          dir: 'dist/browser',
          inlineDynamicImports: true,
          extend: true,
          footer: `
            if (typeof window !== 'undefined' && window.TraceLog?.tracelog) {
              window.tracelog = window.TraceLog.tracelog;
            }
          `,
        },
        {
          // ES Module format for modern imports
          // Usage: import { tracelog } from './tracelog.esm.js'
          format: 'es',
          entryFileNames: 'tracelog.esm.js',
          dir: 'dist/browser',
          inlineDynamicImports: true,
        },
      ],
    },
    target: 'es2022',
    minify: process.env.NODE_ENV !== 'dev',
    sourcemap: process.env.NODE_ENV === 'dev',
  },
});