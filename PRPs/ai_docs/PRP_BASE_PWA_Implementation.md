name: "PWA Implementation - Phase 2 BASE PRP"
description: |
  Comprehensive implementation guide for transforming HSA Songbook into a Progressive Web Application with offline-first capabilities, installability, and sophisticated caching strategies.

---

## Goal

**Feature Goal**: Transform HSA Songbook into a fully-functional Progressive Web Application with offline-first capabilities, enabling users to access and interact with songs, arrangements, and setlists without internet connectivity.

**Deliverable**: Complete PWA infrastructure including service worker, manifest, IndexedDB implementation, caching strategies, sync mechanisms, and metrics tracking.

**Success Definition**: Application passes Lighthouse PWA audit (>90 score), works fully offline after first visit, is installable on all major platforms, and maintains data consistency between online/offline states.

## User Persona

**Target User**: Musicians and worship leaders who need reliable access to chord charts during performances

**Use Case**: Performing in venues with poor/no internet connectivity, quick access to songs during rehearsals, seamless experience across devices

**User Journey**:
1. User installs PWA from browser prompt
2. Views and searches songs while online (data cached automatically)
3. Loses connectivity during performance
4. Continues using app seamlessly with cached data
5. Creates/edits setlists offline
6. Changes sync automatically when reconnected

**Pain Points Addressed**:
- Internet dependency during performances
- Slow loading on poor connections
- Loss of work when offline
- Need to maintain separate offline copies

## Why

- **Reliability**: Musicians need guaranteed access to their music regardless of connectivity
- **Performance**: 3x faster load times through intelligent caching
- **User Experience**: Native app-like experience with install capability
- **Engagement**: Increased user retention through offline functionality
- **Data Safety**: No data loss from connection interruptions

## What

Transform the existing React SPA into a PWA with:
- Full offline functionality via service worker and caching
- Installability on desktop and mobile platforms
- Local data persistence with IndexedDB
- Background sync for offline changes
- Smart caching strategies per resource type
- Real-time metrics and error tracking

### Success Criteria

- [ ] Lighthouse PWA score > 90
- [ ] App loads offline after first visit
- [ ] Install prompt appears on eligible devices
- [ ] Data persists across sessions
- [ ] Offline changes sync when online
- [ ] Cache hit rate > 80%
- [ ] Page load < 3s on 3G
- [ ] No data loss from offline edits

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vite-pwa-org.netlify.app/guide/
  why: Official Vite PWA plugin documentation for configuration
  critical: registerType and workbox configuration patterns

- url: https://developer.chrome.com/docs/workbox/modules/
  why: Workbox strategies and caching patterns
  critical: Runtime caching configuration for different resource types

- url: https://github.com/jakearchibald/idb#readme
  why: idb library documentation for IndexedDB wrapper
  critical: TypeScript usage and migration patterns

- file: PRPs/PRP_SPEC_PWA_Implementation.md
  why: Complete specification with all 20 implementation tasks
  pattern: Task ordering and validation commands
  gotcha: Tasks have dependencies - follow order strictly

- docfile: PRPs/ai_docs/pwa-caching-strategies.md
  why: Comprehensive caching strategy guide for different resources
  section: Resource-Specific Configuration

- docfile: PRPs/ai_docs/indexeddb-schema-migrations.md
  why: Complete IndexedDB schema and migration patterns
  section: Database Schema Design and Migration Strategy

- docfile: PRPs/ai_docs/offline-sync-patterns.md
  why: Offline-first sync patterns and conflict resolution
  section: Core Sync Architecture and Conflict Resolution

- docfile: PRPs/ai_docs/pwa-metrics-tracking.md
  why: Metrics implementation for tracking PWA performance
  section: Core Web Vitals and PWA-Specific Metrics
```

### Current Codebase tree

```bash
hsasongbook/
├── src/
│   ├── app/
│   │   ├── App.jsx          # Main app - needs PWA integration
│   │   └── main.jsx         # Entry point
│   ├── features/
│   │   ├── search/          # Search functionality
│   │   ├── songs/           # Song display
│   │   ├── arrangements/    # Arrangement viewing
│   │   └── shared/
│   │       ├── components/  # Shared UI components
│   │       ├── data/        # Mock JSON data (songs.json, arrangements.json)
│   │       ├── hooks/       # Custom hooks
│   │       └── utils/       # Helper functions
│   └── lib/
│       └── utils.js         # Tailwind utilities
├── public/                  # Empty - needs icons and offline.html
├── index.html              # Needs PWA meta tags
├── vite.config.js          # Needs PWA plugin configuration
└── package.json            # Needs PWA dependencies
```

### Desired Codebase tree with files to be added

```bash
hsasongbook/
├── src/
│   ├── app/
│   │   ├── App.jsx          # MODIFY: Add PWA components
│   │   └── main.jsx         # Entry point
│   ├── features/
│   │   ├── pwa/            # NEW: PWA feature module
│   │   │   ├── index.js    # Export all PWA functionality
│   │   │   ├── components/
│   │   │   │   ├── InstallPrompt.jsx      # Install UI
│   │   │   │   ├── UpdateNotification.jsx # Update alerts
│   │   │   │   └── OfflineIndicator.jsx   # Connection status
│   │   │   ├── hooks/
│   │   │   │   ├── usePWA.js             # Main PWA hook
│   │   │   │   └── useOnlineStatus.js    # Online detection
│   │   │   ├── db/
│   │   │   │   ├── database.js           # IndexedDB setup
│   │   │   │   ├── repository.js         # Data access layer
│   │   │   │   └── migrations.js         # Schema migrations
│   │   │   ├── sync/
│   │   │   │   ├── syncQueue.js          # Offline queue
│   │   │   │   └── conflictResolver.js   # Conflict handling
│   │   │   └── utils/
│   │   │       ├── cacheManager.js       # Cache utilities
│   │   │       ├── performance.js        # Metrics tracking
│   │   │       └── pwaTest.js           # Testing utilities
├── public/
│   ├── icons/              # NEW: App icons
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   ├── offline.html        # NEW: Offline fallback
│   └── robots.txt          # NEW: SEO file
├── index.html              # MODIFY: Add PWA meta tags
├── vite.config.js          # MODIFY: Add PWA plugin config
└── package.json            # MODIFY: Add dependencies
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: vite-plugin-pwa auto-generates service worker
// Don't create sw.js manually - it's generated at build time

// CRITICAL: idb requires proper TypeScript types
// Import DBSchema interface for type safety
import { DBSchema, openDB } from 'idb';

// CRITICAL: Workbox caching requires HTTPS in production
// Use npm run pwa:dev for testing with --host flag

// GOTCHA: iOS Safari has 50MB IndexedDB limit
// Implement data pruning for mobile devices

// GOTCHA: Service worker updates need explicit handling
// Use skipWaiting and clientsClaim carefully
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/pwa/types/pwa.types.ts
interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
  offlineReady: boolean;
}

// src/features/pwa/db/schema.ts
import { DBSchema } from 'idb';

interface HSASongbookDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-title': string;
      'by-artist': string;
      'by-sync-status': SyncStatus;
    };
  };
  arrangements: {
    key: string;
    value: Arrangement;
    indexes: {
      'by-song': string;
      'by-rating': number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': Date;
    };
  };
}

type SyncStatus = 'synced' | 'pending' | 'conflict';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY package.json
  - IMPLEMENT: Add PWA dependencies
  - PACKAGES: vite-plugin-pwa@^0.22.0, idb@^8.0.1, workbox-window@^8.0.0
  - COMMAND: npm install vite-plugin-pwa idb workbox-window
  - VALIDATION: npm list vite-plugin-pwa idb workbox-window

Task 2: MODIFY vite.config.js
  - IMPLEMENT: Configure VitePWA plugin with workbox settings
  - FOLLOW pattern: PRPs/ai_docs/pwa-caching-strategies.md#resource-specific-configuration
  - CRITICAL: Set registerType: 'autoUpdate' for automatic updates
  - VALIDATION: npm run build && ls dist/sw.js

Task 3: CREATE public/icons/
  - IMPLEMENT: Generate PWA icons (192x192, 512x512, maskable versions)
  - TOOL: npx pwa-asset-generator or similar
  - SIZES: icon-192.png, icon-512.png, apple-touch-icon.png
  - VALIDATION: ls -la public/icons/*.png

Task 4: MODIFY index.html
  - IMPLEMENT: Add PWA meta tags in <head>
  - TAGS: theme-color, apple-mobile-web-app-capable, manifest link
  - REFERENCE: PRPs/PRP_SPEC_PWA_Implementation.md#task-5
  - VALIDATION: npm run dev && check DevTools > Application > Manifest

Task 5: CREATE src/features/pwa/db/database.js
  - IMPLEMENT: IndexedDB setup with idb library
  - FOLLOW pattern: PRPs/ai_docs/indexeddb-schema-migrations.md#database-schema-design
  - STORES: songs, arrangements, setlists, syncQueue
  - VALIDATION: npm run dev && check DevTools > Application > Storage

Task 6: CREATE src/features/pwa/db/repository.js
  - IMPLEMENT: Repository pattern for data access
  - FOLLOW pattern: PRPs/ai_docs/offline-sync-patterns.md#offline-first-principle
  - METHODS: get(), save(), search(), sync()
  - DEPENDENCIES: Import database from Task 5

Task 7: CREATE src/features/pwa/hooks/usePWA.js
  - IMPLEMENT: Main PWA hook with service worker registration
  - FOLLOW pattern: PRPs/PRP_SPEC_PWA_Implementation.md#task-7
  - EXPORTS: needRefresh, offlineReady, updateServiceWorker
  - VALIDATION: Check service worker registered in DevTools

Task 8: CREATE src/features/pwa/components/InstallPrompt.jsx
  - IMPLEMENT: Custom install UI component
  - FOLLOW pattern: shadcn/ui Card and Button components
  - EVENTS: beforeinstallprompt, appinstalled
  - VALIDATION: Test on mobile device or Chrome DevTools

Task 9: CREATE src/features/pwa/components/UpdateNotification.jsx
  - IMPLEMENT: Update notification when new version available
  - PROPS: onUpdate callback to refresh app
  - STYLE: Fixed position bottom-right with shadcn/ui Card
  - VALIDATION: Deploy update and verify notification appears

Task 10: CREATE src/features/pwa/components/OfflineIndicator.jsx
  - IMPLEMENT: Visual indicator for offline status
  - HOOK: useOnlineStatus from Task 11
  - STYLE: Subtle banner or badge
  - VALIDATION: Toggle offline in DevTools Network tab

Task 11: CREATE src/features/pwa/hooks/useOnlineStatus.js
  - IMPLEMENT: Online/offline detection hook
  - EVENTS: online, offline events
  - RETURN: isOnline boolean
  - VALIDATION: Test state changes with network toggle

Task 12: CREATE src/features/pwa/sync/syncQueue.js
  - IMPLEMENT: Queue for offline operations
  - FOLLOW pattern: PRPs/ai_docs/offline-sync-patterns.md#sync-queue-implementation
  - METHODS: enqueue(), processQueue(), retry logic
  - VALIDATION: Create items offline, verify sync when online

Task 13: CREATE public/offline.html
  - IMPLEMENT: Offline fallback page
  - STYLE: Inline critical CSS for offline viewing
  - CONTENT: Friendly message with retry button
  - VALIDATION: Navigate offline to uncached page

Task 14: MODIFY src/app/App.jsx
  - IMPLEMENT: Integrate PWA components
  - IMPORT: usePWA, UpdateNotification, OfflineIndicator, InstallPrompt
  - PLACEMENT: UpdateNotification and OfflineIndicator at app level
  - VALIDATION: All PWA features visible and functional

Task 15: CREATE src/features/pwa/utils/performance.js
  - IMPLEMENT: Performance metrics tracking
  - FOLLOW pattern: PRPs/ai_docs/pwa-metrics-tracking.md#performance-monitoring
  - METRICS: Web vitals, cache hit rate, offline usage
  - VALIDATION: Check console logs for metrics

Task 16: ADD package.json scripts
  - SCRIPTS: "pwa:dev": "vite --host", "pwa:audit": "lighthouse http://localhost:5173"
  - PURPOSE: Network testing and PWA validation
  - VALIDATION: npm run pwa:dev && access from mobile device
```

### Implementation Patterns & Key Details

```javascript
// VitePWA Configuration Pattern (vite.config.js)
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'HSA Songbook',
        short_name: 'HSA Songs',
        theme_color: '#1e293b',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          // PATTERN: Different strategies for different resources
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});

// IndexedDB Repository Pattern
import { openDB } from 'idb';

class SongRepository {
  async init() {
    this.db = await openDB('HSASongbook', 1, {
      upgrade(db) {
        // CRITICAL: Create stores and indexes in upgrade
        const store = db.createObjectStore('songs', { keyPath: 'id' });
        store.createIndex('by-title', 'title');
      }
    });
  }

  async save(song) {
    // PATTERN: Always save locally first
    await this.db.put('songs', song);
    // PATTERN: Queue for sync if needed
    if (!navigator.onLine) {
      await this.queueForSync(song);
    }
  }
}
```

### Integration Points

```yaml
DATABASE:
  - IndexedDB stores: songs, arrangements, setlists, syncQueue
  - Mock data migration: Import from src/features/shared/data/*.json

ROUTING:
  - No changes needed - React Router works offline with service worker

EXISTING FEATURES:
  - Search: Modify to use IndexedDB repository
  - Songs: Update to use offline-first data layer
  - Arrangements: Cache ChordPro data locally
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each file creation
npm run lint                         # Fix any linting errors
npm run build                        # Ensure build succeeds

# Expected: Zero errors
```

### Level 2: PWA Validation

```bash
# Build and preview production
npm run build
npm run preview

# Open Chrome DevTools > Application
# Check:
# - Manifest detected
# - Service Worker registered
# - IndexedDB created with correct stores

# Lighthouse audit
npm run pwa:audit

# Expected: PWA score > 90
```

### Level 3: Offline Testing

```bash
# Start dev server with network access
npm run pwa:dev

# Test offline functionality
# 1. Load app and browse some songs
# 2. DevTools > Network > Offline
# 3. Navigate to previously viewed content
# 4. Try searching (should work with cached data)

# Expected: App remains functional offline
```

### Level 4: Installation Testing

```bash
# Test on real device or responsive mode
npm run pwa:dev --host

# Access from mobile device on same network
# Look for install prompt in browser
# Install and verify:
# - App opens in standalone mode
# - Icons display correctly
# - Offline functionality works

# Expected: Successful installation and operation
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation commands pass
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Service worker registered and active
- [ ] IndexedDB stores created successfully
- [ ] Lighthouse PWA score > 90

### Feature Validation

- [ ] App loads offline after first visit
- [ ] Install prompt appears on eligible devices
- [ ] App installs and runs in standalone mode
- [ ] Data persists across sessions in IndexedDB
- [ ] Offline changes queue for sync
- [ ] Update notifications appear for new versions
- [ ] Cache strategies work for different resource types

### Code Quality Validation

- [ ] Follows existing React patterns
- [ ] Uses shadcn/ui components consistently
- [ ] Error boundaries handle failures gracefully
- [ ] All PWA components integrated cleanly
- [ ] Repository pattern implemented correctly

### Documentation & Deployment

- [ ] All referenced documentation files exist
- [ ] Service worker generates correctly on build
- [ ] Manifest validates in DevTools
- [ ] Icons display at all required sizes

---

## Anti-Patterns to Avoid

- ❌ Don't create service worker manually - let Vite PWA generate it
- ❌ Don't skip offline testing before deployment
- ❌ Don't ignore iOS Safari limitations (50MB storage)
- ❌ Don't cache sensitive user data without encryption
- ❌ Don't skip conflict resolution in sync logic
- ❌ Don't forget to handle service worker updates
- ❌ Don't block UI while syncing data
- ❌ Don't ignore cache size limits

---

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with:
- Complete specification reference (20 tasks)
- Four detailed technical documentation files
- Specific code patterns and validation commands
- Clear dependency ordering
- Extensive validation procedures

The implementation should succeed in one pass with all provided context and documentation.