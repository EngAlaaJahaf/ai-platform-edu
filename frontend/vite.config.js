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
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'ذكاء EduAI - المنصة الأكاديمية الذكية',
        short_name: 'EduAI',
        description: 'منصة RAG وتلخيص واختبارات تعمل Offline',
        theme_color: '#4F46E5',
        background_color: '#020617',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
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
