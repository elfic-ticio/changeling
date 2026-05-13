import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  // Shebang is declared in src/index.ts; esbuild preserves it in dist/index.js.
});
