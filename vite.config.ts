import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site/src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
