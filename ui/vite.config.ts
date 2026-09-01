import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
  },
  plugins: [
    react(),
    VitePWA({
      srcDir: 'src',
      filename: 'service-worker.ts',
      strategies: 'injectManifest',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: false,
      injectRegister: false,
    }),
  ],
});
