import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPWAConfig, getPWAManifest } from './src/lib/config/pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const pwaConfig = getPWAConfig(isDev);
  const pwaManifest = getPWAManifest(isDev);

  return {
    plugins: [
      react(),
      VitePWA({
        // PWA Configuration
        // Development: skipWaiting disabled for stable development experience
        // Production: skipWaiting enabled for immediate updates
        registerType: isDev ? 'prompt' : 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: pwaManifest,
        // Add development options
        ...(isDev && {
          devOptions: {
            enabled: true,
            type: 'module',
            navigateFallback: 'index.html'
          }
        }),
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          navigateFallback: '/offline.html',
          // Don't intercept these routes with service worker
          navigateFallbackDenylist: [
            /^\/api/,  // API routes
          ],
          runtimeCaching: [
            // CacheFirst for static assets and fonts
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: pwaConfig.images.maxEntries,
                  maxAgeSeconds: pwaConfig.images.maxAgeSeconds
                },
              },
            },
            // Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: pwaConfig.googleFontsStylesheets.maxEntries,
                  maxAgeSeconds: pwaConfig.googleFontsStylesheets.maxAgeSeconds
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: pwaConfig.googleFontsWebfonts.maxEntries,
                  maxAgeSeconds: pwaConfig.googleFontsWebfonts.maxAgeSeconds
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // StaleWhileRevalidate for JSON data
            {
              urlPattern: /\.json$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'json-data-cache',
                expiration: {
                  maxEntries: pwaConfig.json.maxEntries,
                  maxAgeSeconds: pwaConfig.json.maxAgeSeconds
                },
              },
            },
            // ChordPro files
            {
              urlPattern: /\.chordpro$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'chordpro-cache',
                expiration: {
                  maxEntries: pwaConfig.chordpro.maxEntries,
                  maxAgeSeconds: pwaConfig.chordpro.maxAgeSeconds
                },
              },
            },
            // API calls (future)
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: pwaConfig.api.networkTimeoutSeconds,
                expiration: {
                  maxEntries: pwaConfig.api.maxEntries,
                  maxAgeSeconds: pwaConfig.api.maxAgeSeconds
                },
              },
            },
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: !isDev, // Only skip waiting in production
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
