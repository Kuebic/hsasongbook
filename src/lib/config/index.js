/**
 * Centralized configuration system for HSA Songbook
 * All hardcoded values and magic numbers are extracted here for maintainability
 */

export const config = {
  app: {
    name: 'HSA Songbook',
    shortName: 'HSA Songs',
    version: '1.0.0' // Can be overridden by environment variable at runtime
  },
  database: {
    name: 'HSASongbookDB',
    version: 3,
    reconnectionDelay: 1000, // ms
    healthThreshold: 0.8 // 80%
  },
  sync: {
    maxRetries: 3,
    baseDelay: 1000, // ms
    maxDelay: 30000, // ms
    jitterPercent: 0.1, // 10%
    cleanupAgeHours: 24,
    simulationFailureRate: 0.1, // 10% for testing
    simulationTimeout: 100 // ms
  },
  cache: {
    version: '1',
    names: {
      static: 'hsasongbook-static',
      dynamic: 'hsasongbook-dynamic',
      api: 'hsasongbook-api',
      images: 'hsasongbook-images'
    },
    maxAge: {
      dynamic: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      api: 24 * 60 * 60 * 1000 // 1 day in ms
    },
    storage: {
      warningThreshold: 0.8, // 80%
      criticalThreshold: 0.95, // 95%
      largeEntriesThreshold: 1000
    }
  },
  performance: {
    webVitals: {
      fcp: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
      lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
      fid: { good: 100, poor: 300 },   // First Input Delay (ms)
      cls: { good: 0.1, poor: 0.25 }   // Cumulative Layout Shift (score)
    },
    network: {
      fastResponseMs: 500,
      slowResponseMs: 2000
    }
  },
  pwa: {
    cacheExpiration: {
      images: 60 * 60 * 24 * 365,      // 1 year in seconds
      fonts: 60 * 60 * 24 * 365,       // 1 year in seconds
      json: 60 * 60 * 24 * 7,          // 1 week in seconds
      chordpro: 60 * 60 * 24 * 90,     // 90 days in seconds
      api: 60 * 60                     // 1 hour in seconds
    },
    cacheMaxEntries: {
      images: 100,
      fontsStylesheets: 10,
      fontsWebfonts: 30,
      json: 50,
      chordpro: 200,
      api: 50
    },
    networkTimeoutSeconds: 5
  },
  chordpro: {
    editor: {
      mobileBreakpoint: 768,              // Mobile breakpoint in pixels
      autoSave: {
        debounceMs: 1000,               // Auto-save delay in milliseconds
        idleTimeoutMs: 5000,            // Idle timeout before forced save
        enablePeriodicSave: true,       // Enable periodic saves every interval
        maxDraftsPerEntity: 10,         // Maximum drafts to keep per arrangement
        cleanupIntervalHours: 24        // Hours between draft cleanup
      },
      toolbar: {
        enableQuickInsert: true,        // Enable quick-insert chord/directive buttons
        showChordPalette: true,         // Show chord palette in toolbar
        mobileCollapsible: true,        // Allow toolbar collapse on mobile
        commonChords: ['C', 'G', 'Am', 'F', 'D', 'Em', 'Dm', 'A', 'E', 'Bm'], // Most used chords
        directiveShortcuts: ['title', 'artist', 'key', 'tempo', 'verse', 'chorus', 'bridge'] // Quick directives
      },
      editor: {
        lineNumbers: true,              // Show line numbers
        bracketMatching: true,          // Highlight matching brackets
        autoIndent: true,               // Auto-indent new lines
        fontSize: 'medium',             // Font size: 'small' | 'medium' | 'large'
        lineWrapping: true,             // Enable line wrapping
        tabSize: 2,                     // Tab size in spaces
        spellcheck: false,              // Disable spellcheck for chord notation
        minHeight: '300px',             // Minimum editor height
        maxHeight: '800px'              // Maximum editor height before scrolling
      },
      completion: {
        activateOnTyping: true,         // Show completions while typing
        maxRenderedOptions: 20,         // Maximum completion items to show
        debounceMs: 150,                // Debounce completion trigger
        includeChords: true,            // Include chord completions
        includeDirectives: true,        // Include directive completions
        caseSensitive: false            // Case sensitive completion matching
      },
      validation: {
        enableLiveValidation: true,     // Real-time syntax validation
        showErrorTooltips: true,        // Show error details on hover
        highlightErrors: true,          // Highlight syntax errors
        warnOnUnknownChords: false,     // Warn for non-standard chord notation
        validateDirectives: true        // Validate ChordPro directive syntax
      },
      performance: {
        syntaxHighlightThrottle: 100,   // Throttle syntax highlighting updates (ms)
        largeDocumentThreshold: 1000,   // Lines considered "large document"
        enableVirtualization: false,    // Virtual scrolling for very large docs
        maxUndoHistory: 100             // Maximum undo/redo history entries
      }
    }
  }
};

// Export individual sections for convenience
export const appConfig = config.app;
export const databaseConfig = config.database;
export const syncConfig = config.sync;
export const cacheConfig = config.cache;
export const performanceConfig = config.performance;
export const pwaConfig = config.pwa;
export const chordproConfig = config.chordpro;

export default config;