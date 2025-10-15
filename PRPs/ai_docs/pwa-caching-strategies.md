# PWA Caching Strategies Reference Guide
## For HSA Songbook Implementation

---

## Overview
This document provides comprehensive caching strategies for the HSA Songbook PWA implementation using Vite PWA plugin and Workbox.

## Core Caching Strategies

### 1. CacheFirst Strategy
**Use for:** Static assets that rarely change
- Images (PNG, JPG, SVG, WebP)
- Fonts (WOFF2, TTF)
- Versioned CSS/JS files

```javascript
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    },
  },
}
```

### 2. NetworkFirst Strategy
**Use for:** Dynamic content that needs to be fresh when online
- HTML pages
- API endpoints that require fresh data
- User-specific content

```javascript
{
  urlPattern: /^https:\/\/api\.hsasongbook\.com\/songs/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60, // 1 hour
    },
  },
}
```

### 3. StaleWhileRevalidate Strategy
**Use for:** Content that benefits from instant loading but should update in background
- JSON data files
- User avatars
- Non-critical API responses
- Arrangement data

```javascript
{
  urlPattern: /\/api\/arrangements\//,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'arrangements-cache',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
    },
  },
}
```

## Resource-Specific Configuration

### Static Assets
```javascript
// CSS and JavaScript
{
  urlPattern: /\.(?:js|css)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'static-assets',
    expiration: {
      maxEntries: 60,
      maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    },
  },
}
```

### External Resources
```javascript
// Google Fonts
{
  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'google-fonts-stylesheets',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
  },
},
// Font files
{
  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'google-fonts-webfonts',
    expiration: {
      maxEntries: 30,
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
    cacheableResponse: {
      statuses: [0, 200],
    },
  },
}
```

### Song and Arrangement Data
```javascript
// Song metadata
{
  urlPattern: /\/api\/songs\/[^/]+$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'songs-cache',
    expiration: {
      maxEntries: 500,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    },
  },
},
// ChordPro data
{
  urlPattern: /\.chordpro$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'chordpro-cache',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
    },
  },
}
```

## Cache Management

### Storage Limits
- **Chrome/Edge:** ~6% of free disk space
- **Safari iOS:** 50MB Cache API
- **Conservative target:** 50MB total for mobile

### Cache Versioning
```javascript
// In vite.config.js
VitePWA({
  workbox: {
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
  }
})
```

### Cache Cleanup Strategy
```javascript
// Maximum cache sizes
const CACHE_LIMITS = {
  'images-cache': { maxEntries: 100 },
  'songs-cache': { maxEntries: 500 },
  'arrangements-cache': { maxEntries: 200 },
  'api-cache': { maxEntries: 50 },
};
```

## Offline Fallback

### Offline Page Configuration
```javascript
// vite.config.js
VitePWA({
  workbox: {
    navigateFallback: '/offline.html',
    navigateFallbackDenylist: [/^\/api/],
  }
})
```

## Performance Optimization

### Precaching Critical Assets
```javascript
VitePWA({
  workbox: {
    globPatterns: [
      '**/*.{js,css,html}',
      'icons/*.png',
      'manifest.webmanifest'
    ],
    globIgnores: [
      '**/node_modules/**/*',
      'sw.js',
      'workbox-*.js'
    ]
  }
})
```

### Runtime Caching Order of Priority
1. **Critical:** App shell, core JS/CSS
2. **High:** Songs viewed recently, popular arrangements
3. **Medium:** Search results, user preferences
4. **Low:** Rarely accessed songs, old arrangements

## Implementation Checklist

- [ ] Configure Vite PWA plugin with appropriate strategies
- [ ] Set up cache size limits for each cache
- [ ] Implement offline fallback page
- [ ] Configure cache versioning
- [ ] Add cache cleanup on activation
- [ ] Test offline functionality
- [ ] Monitor cache hit rates
- [ ] Implement cache warming for popular content

## References
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [Vite PWA Documentation](https://vite-pwa-org.netlify.app/)
- [Cache Storage Best Practices](https://web.dev/articles/cache-api-quick-guide)