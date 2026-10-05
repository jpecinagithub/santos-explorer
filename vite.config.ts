import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Vidas de Santos — Descubre todos los santos',
        short_name: 'Santos',
        description:
          'Busca y explora más de 2.000 santos por nombre, país, orden religiosa o siglo. Portal bilingüe ES/EN con biografías de Wikipedia.',
        theme_color: '#13161A',
        background_color: '#F7F6F3',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + saints index cached for offline; Wikipedia content is cached
        // separately in localStorage by the app itself (24h TTL).
        // The saints data chunk exceeds workbox's 2 MiB default precache limit
        // (it now carries Spanish summaries), so raise the cap to keep it offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wiki-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            if (/react|react-dom|react-router-dom|scheduler/.test(id)) return "vendor-react";
            if (id.includes("recharts")) return "vendor-charts";
            if (/fuse\.js|dompurify|i18next|react-i18next|react-helmet-async|@vercel/.test(id))
              return "vendor-utils";
          }
          if (id.includes("src/data/saints.json")) return "saints-data";
          return undefined;
        },
      },
    },
  },
})
