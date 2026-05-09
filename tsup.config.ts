import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'public-api': 'src/public-api.ts',
    'pixel/index': 'src/pixel/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: true,
  external: ['web-vitals'],
  env: {
    NODE_ENV: 'production',
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs',
    };
  },
});
