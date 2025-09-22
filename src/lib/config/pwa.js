/**
 * PWA-specific configuration for Vite build
 * Provides cache configurations for the PWA plugin
 */

import { getConfig } from './environment.js';

/**
 * Get PWA configuration for Vite
 * @param {boolean} isDev - Whether in development mode
 * @returns {Object} PWA cache configuration
 */
export function getPWAConfig(isDev = false) {
  const config = getConfig(isDev ? 'development' : 'production');

  return {
    images: {
      maxEntries: config.pwa.cacheMaxEntries.images,
      maxAgeSeconds: config.pwa.cacheExpiration.images
    },
    googleFontsStylesheets: {
      maxEntries: config.pwa.cacheMaxEntries.fontsStylesheets,
      maxAgeSeconds: config.pwa.cacheExpiration.fonts
    },
    googleFontsWebfonts: {
      maxEntries: config.pwa.cacheMaxEntries.fontsWebfonts,
      maxAgeSeconds: config.pwa.cacheExpiration.fonts
    },
    json: {
      maxEntries: config.pwa.cacheMaxEntries.json,
      maxAgeSeconds: config.pwa.cacheExpiration.json
    },
    chordpro: {
      maxEntries: config.pwa.cacheMaxEntries.chordpro,
      maxAgeSeconds: config.pwa.cacheExpiration.chordpro
    },
    api: {
      maxEntries: config.pwa.cacheMaxEntries.api,
      maxAgeSeconds: config.pwa.cacheExpiration.api,
      networkTimeoutSeconds: config.pwa.networkTimeoutSeconds
    }
  };
}

/**
 * Get complete PWA manifest configuration
 * @param {boolean} isDev - Whether in development mode
 * @returns {Object} PWA manifest configuration
 */
export function getPWAManifest(isDev = false) {
  const config = getConfig(isDev ? 'development' : 'production');

  return {
    name: config.app.name,
    short_name: config.app.shortName,
    description: 'Progressive Web App for musicians and worship leaders to manage chord charts',
    theme_color: '#1e293b',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    categories: ['music', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

export default getPWAConfig;