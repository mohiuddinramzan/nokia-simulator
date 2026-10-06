import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  root: 'src',
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __VARIANT__: JSON.stringify(process.env.APP_VARIANT || 'real'),
  },
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2019',
  },
  server: {
    host: true,
    port: 5173,
  },
});
