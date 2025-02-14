// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'  // Import de 'path' pour gérer les chemins

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Enregistre le Service Worker
      includeAssets: ['favicon.ico', 'robots.txt'], // Inclut les assets que tu veux dans le cache
      manifest: {
        name: 'SunBassSchool',
        short_name: 'SunBass',
        description: 'Une école de musique pour bassistes',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        icons: [
          {
            src: '/assets/logo.png', // Spécifie ton logo ici
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/logo.png', // Spécifie un autre logo pour une plus grande résolution
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // Ajout de l'alias pour résoudre les chemins
    },
  },
})
