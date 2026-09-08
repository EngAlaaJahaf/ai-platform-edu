import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ذكاء EduAI - المساعد الأكاديمي الذكي',
        short_name: 'EduAI',
        description: 'منصة RAG وتلخيص واختبارات ومصطلحات أكاديمية تعمل Offline',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#863bff',
        background_color: '#F6F1FF',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/api\.*/i, handler: 'NetworkFirst', options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 } },
          { urlPattern: /^http:\/\/127\.0\.0\.1:8001\/api\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'api-cache' } }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      }
    }
  }
})
