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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '俄语背词 - 留学实用变格单词',
        short_name: '俄语背词',
        description: '俄罗斯留学场景高频俄语单词学习，专注变格变位实用记忆',
        theme_color: '#1e293b',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for wordBank.json
        runtimeCaching: [
          {
            urlPattern: /\/wordBank\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wordbank-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 30 * 86400 },
            },
          },
        ],
      },
    }),
  ],
})
