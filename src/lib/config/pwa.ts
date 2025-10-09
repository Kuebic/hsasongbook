/**
 * PWA-specific configuration for Vite build
 * Provides cache configurations for the PWA plugin
 */

import { getConfig } from './environment';

interface PWACacheConfig {
  maxEntries: number;
  maxAgeSeconds: number;
}

interface PWAAPIConfig extends PWACacheConfig {
  networkTimeoutSeconds: number;
}

export interface PWABuildConfig {
  images: PWACacheConfig;
  googleFontsStylesheets: PWACacheConfig;
  googleFontsWebfonts: PWACacheConfig;
  json: PWACacheConfig;
  chordpro: PWACacheConfig;
  api: PWAAPIConfig;
}

export interface PWAManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: string;
  orientation: string;
  scope: string;
  start_url: string;
  categories: string[];
  icons: PWAManifestIcon[];
}

/**
 * Get PWA configuration for Vite
 * @param isDev - Whether in development mode
 * @returns PWA cache configuration
 */
export function getPWAConfig(isDev: boolean = false): PWABuildConfig {
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
 * @param isDev - Whether in development mode
 * @returns PWA manifest configuration
 */
export function getPWAManifest(isDev: boolean = false): PWAManifest {
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
