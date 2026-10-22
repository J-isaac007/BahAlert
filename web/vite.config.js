import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FloodWatch Lite',
        short_name: 'FloodWatch',
        description: 'Community flood level monitor and evacuation map',
        theme_color: '#0f4c81',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // App shell only. Mapbox terms forbid caching map tiles.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
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
