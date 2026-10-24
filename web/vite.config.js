import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves from /BahAlert/; the deploy workflow sets BASE_PATH
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BahAlert',
        short_name: 'BahAlert',
        description: 'Low-cost community flood level monitor and early warning map',
        theme_color: '#05090d',
        background_color: '#05090d',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // App shell only. Mapbox terms forbid caching map tiles.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  // mapbox-gl alone is ~1.9 MB minified; nothing to split there
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
