# PWA Metrics and Tracking Guide
## For HSA Songbook Implementation

---

## Overview
This document provides comprehensive metrics tracking strategies for monitoring performance, user engagement, and PWA-specific behaviors in the HSA Songbook application.

## Core Web Vitals

### Implementation with web-vitals Library
```typescript
// Install: npm install web-vitals

import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

class WebVitalsCollector {
  private buffer: VitalMetric[] = [];
  private endpoint = '/api/metrics/vitals';

  initialize(): void {
    // Cumulative Layout Shift
    onCLS(this.reportMetric);

    // Interaction to Next Paint (replaced FID)
    onINP(this.reportMetric);

    // Largest Contentful Paint
    onLCP(this.reportMetric);

    // First Contentful Paint
    onFCP(this.reportMetric);

    // Time to First Byte
    onTTFB(this.reportMetric);

    // Send buffered metrics before unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  private reportMetric = (metric: Metric): void => {
    const vitalMetric: VitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating || this.getRating(metric),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate'
    };

    this.buffer.push(vitalMetric);

    // Send immediately for critical metrics
    if (['LCP', 'CLS', 'INP'].includes(metric.name)) {
      this.flush();
    }
  };

  private getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      INP: [200, 500],
      LCP: [2500, 4000],
      FCP: [1800, 3000],
      TTFB: [800, 1800]
    };

    const [good, poor] = thresholds[metric.name] || [0, 0];

    if (metric.value <= good) return 'good';
    if (metric.value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const payload = JSON.stringify({
      metrics: this.buffer,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      });
    }

    this.buffer = [];
  }
}
```

## PWA-Specific Metrics

### Installation and Engagement Tracking
```typescript
interface PWAMetrics {
  installPromptShown: boolean;
  installPromptAccepted: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  displayMode: string;
  offlinePageViews: number;
  cacheHitRate: number;
  syncSuccessRate: number;
}

class PWAMetricsCollector {
  private metrics: PWAMetrics = {
    installPromptShown: false,
    installPromptAccepted: false,
    isInstalled: false,
    isStandalone: false,
    displayMode: this.getDisplayMode(),
    offlinePageViews: 0,
    cacheHitRate: 0,
    syncSuccessRate: 0
  };

  initialize(): void {
    this.trackInstallability();
    this.trackDisplayMode();
    this.trackOfflineUsage();
    this.trackCachePerformance();
  }

  private trackInstallability(): void {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.metrics.installPromptShown = true;

      this.track('install_prompt_shown', {
        timestamp: Date.now()
      });

      // Track user's response
      deferredPrompt.userChoice.then((choice: { outcome: string }) => {
        this.metrics.installPromptAccepted = choice.outcome === 'accepted';

        this.track('install_prompt_response', {
          outcome: choice.outcome,
          timestamp: Date.now()
        });
      });
    });

    window.addEventListener('appinstalled', () => {
      this.metrics.isInstalled = true;

      this.track('app_installed', {
        timestamp: Date.now(),
        source: 'browser_prompt'
      });
    });
  }

  private trackDisplayMode(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    this.metrics.isStandalone = isStandalone;
    this.metrics.displayMode = this.getDisplayMode();

    this.track('display_mode', {
      mode: this.metrics.displayMode,
      isStandalone
    });
  }

  private trackOfflineUsage(): void {
    if (!navigator.onLine) {
      this.metrics.offlinePageViews++;

      this.track('offline_page_view', {
        url: window.location.href,
        timestamp: Date.now()
      });
    }

    window.addEventListener('online', () => {
      this.track('connectivity_change', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      this.track('connectivity_change', { status: 'offline' });
    });
  }

  private trackCachePerformance(): void {
    // Track via Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'cache-hit') {
          this.updateCacheHitRate(true);
        } else if (event.data.type === 'cache-miss') {
          this.updateCacheHitRate(false);
        }
      });
    }
  }

  private updateCacheHitRate(hit: boolean): void {
    // Implement rolling average
    const weight = 0.95;
    this.metrics.cacheHitRate = hit
      ? this.metrics.cacheHitRate * weight + (1 - weight)
      : this.metrics.cacheHitRate * weight;

    if (Math.random() < 0.1) { // Sample 10% to reduce noise
      this.track('cache_performance', {
        hitRate: this.metrics.cacheHitRate,
        timestamp: Date.now()
      });
    }
  }

  private getDisplayMode(): string {
    const modes = ['standalone', 'minimal-ui', 'fullscreen', 'browser'];

    for (const mode of modes) {
      if (window.matchMedia(`(display-mode: ${mode})`).matches) {
        return mode;
      }
    }

    return 'browser';
  }

  private track(event: string, data: any): void {
    // Send to analytics
    console.log(`PWA Event: ${event}`, data);
  }
}
```

## Custom Application Metrics

### Song and User Engagement Metrics
```typescript
interface SongbookMetrics {
  songsViewed: number;
  songsViewedOffline: number;
  avgViewDuration: number;
  searchQueries: number;
  transpositions: number;
  setlistsCreated: number;
  arrangementsViewed: number;
  syncAttempts: number;
  syncFailures: number;
}

class SongbookMetricsCollector {
  private metrics: SongbookMetrics = {
    songsViewed: 0,
    songsViewedOffline: 0,
    avgViewDuration: 0,
    searchQueries: 0,
    transpositions: 0,
    setlistsCreated: 0,
    arrangementsViewed: 0,
    syncAttempts: 0,
    syncFailures: 0
  };

  private viewStartTime: number = 0;
  private viewDurations: number[] = [];

  trackSongView(songId: string, arrangementId?: string): void {
    this.viewStartTime = performance.now();
    this.metrics.songsViewed++;

    if (!navigator.onLine) {
      this.metrics.songsViewedOffline++;
    }

    this.track('song_view', {
      songId,
      arrangementId,
      isOffline: !navigator.onLine,
      timestamp: Date.now()
    });
  }

  trackSongExit(): void {
    if (this.viewStartTime > 0) {
      const duration = performance.now() - this.viewStartTime;
      this.viewDurations.push(duration);

      // Keep rolling average of last 100 views
      if (this.viewDurations.length > 100) {
        this.viewDurations.shift();
      }

      this.metrics.avgViewDuration =
        this.viewDurations.reduce((a, b) => a + b, 0) / this.viewDurations.length;

      this.track('song_view_duration', {
        duration,
        avgDuration: this.metrics.avgViewDuration
      });

      this.viewStartTime = 0;
    }
  }

  trackSearch(query: string, resultsCount: number): void {
    this.metrics.searchQueries++;

    this.track('search', {
      query: query.substring(0, 50), // Limit for privacy
      resultsCount,
      timestamp: Date.now()
    });
  }

  trackTransposition(fromKey: string, toKey: string, songId: string): void {
    this.metrics.transpositions++;

    this.track('transposition', {
      fromKey,
      toKey,
      songId,
      timestamp: Date.now()
    });
  }

  trackSetlistCreated(setlistId: string, songCount: number): void {
    this.metrics.setlistsCreated++;

    this.track('setlist_created', {
      setlistId,
      songCount,
      timestamp: Date.now()
    });
  }

  trackSyncAttempt(success: boolean, duration: number, itemsSync.Synced?: number): void {
    this.metrics.syncAttempts++;

    if (!success) {
      this.metrics.syncFailures++;
    }

    const successRate =
      (this.metrics.syncAttempts - this.metrics.syncFailures) / this.metrics.syncAttempts;

    this.track('sync_attempt', {
      success,
      duration,
      itemsSynced,
      successRate,
      timestamp: Date.now()
    });
  }

  private track(event: string, data: any): void {
    // Queue for batch sending
    this.queueMetric(event, data);
  }

  private queueMetric(event: string, data: any): void {
    // Implementation for batching metrics
  }
}
```

## Performance Monitoring

### Performance Observer Implementation
```typescript
class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];
  private marks: Map<string, number> = new Map();

  initialize(): void {
    this.observeLongTasks();
    this.observePaint();
    this.observeNavigation();
    this.observeResources();
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.track('long_task', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });

        observer.observe({ type: 'longtask', buffered: true });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  private observePaint(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track('paint', {
            name: entry.name,
            startTime: entry.startTime
          });
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Paint observer not supported');
    }
  }

  private observeNavigation(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;

          this.track('navigation', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            type: navEntry.type,
            transferSize: navEntry.transferSize,
            encodedBodySize: navEntry.encodedBodySize
          });
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private observeResources(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.track('slow_resource', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize
            });
          }
        }
      });

      observer.observe({ type: 'resource', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  // Custom performance marks
  markStart(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(`${name}-start`);
  }

  markEnd(name: string): void {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      this.track('custom_timing', {
        name,
        duration,
        timestamp: Date.now()
      });

      this.marks.delete(name);
    }
  }

  private track(type: string, data: any): void {
    console.log(`Performance: ${type}`, data);
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}
```

## Error Tracking

### Comprehensive Error Monitoring
```typescript
interface ErrorReport {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  type: 'error' | 'unhandledrejection' | 'custom';
  timestamp: number;
  url: string;
  userAgent: string;
  isOffline: boolean;
}

class ErrorTracker {
  private errorQueue: ErrorReport[] = [];
  private endpoint = '/api/errors';
  private maxQueueSize = 100;

  initialize(): void {
    this.setupErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupOfflineQueue();
  }

  private setupErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        isOffline: !navigator.onLine
      });
    });
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        type: 'unhandledrejection',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        isOffline: !navigator.onLine
      });
    });
  }

  private setupOfflineQueue(): void {
    window.addEventListener('online', () => {
      this.flushErrorQueue();
    });
  }

  reportError(error: ErrorReport): void {
    // Add to queue
    this.errorQueue.push(error);

    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Try to send immediately if online
    if (navigator.onLine) {
      this.flushErrorQueue();
    } else {
      // Store in IndexedDB for persistence
      this.storeErrorsOffline();
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true
      });

      if (!response.ok) {
        // Re-queue on failure
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      // Re-queue on network failure
      this.errorQueue.unshift(...errors);
    }
  }

  private async storeErrorsOffline(): Promise<void> {
    // Store in IndexedDB for later sync
    // Implementation details...
  }
}
```

## Analytics Integration

### Unified Analytics Interface
```typescript
interface AnalyticsEvent {
  name: string;
  category: string;
  properties: Record<string, any>;
  timestamp: number;
}

class UnifiedAnalytics {
  private providers: AnalyticsProvider[] = [];
  private buffer: AnalyticsEvent[] = [];
  private batchSize = 20;
  private flushInterval = 5000;

  constructor() {
    // Flush periodically
    setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  track(name: string, category: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name,
      category,
      properties: {
        ...properties,
        isOffline: !navigator.onLine,
        displayMode: this.getDisplayMode(),
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.buffer.push(event);

    // Flush if buffer is full
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Send to all providers
    this.providers.forEach(provider => {
      provider.sendBatch(events);
    });
  }

  private getDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
  }
}

interface AnalyticsProvider {
  sendBatch(events: AnalyticsEvent[]): void;
}

// Google Analytics 4 Provider
class GA4Provider implements AnalyticsProvider {
  sendBatch(events: AnalyticsEvent[]): void {
    if (typeof gtag === 'undefined') return;

    events.forEach(event => {
      gtag('event', event.name, {
        event_category: event.category,
        ...event.properties
      });
    });
  }
}

// Custom Backend Provider
class BackendProvider implements AnalyticsProvider {
  private endpoint = '/api/analytics';

  sendBatch(events: AnalyticsEvent[]): void {
    const payload = JSON.stringify({ events });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      });
    }
  }
}
```

## React Integration

### Metrics Hook
```typescript
// hooks/useMetrics.ts
import { useEffect, useRef } from 'react';

export function useMetrics() {
  const webVitals = useRef<WebVitalsCollector>();
  const pwaMetrics = useRef<PWAMetricsCollector>();
  const songbookMetrics = useRef<SongbookMetricsCollector>();
  const performance = useRef<PerformanceMonitor>();
  const errors = useRef<ErrorTracker>();
  const analytics = useRef<UnifiedAnalytics>();

  useEffect(() => {
    // Initialize all collectors
    webVitals.current = new WebVitalsCollector();
    webVitals.current.initialize();

    pwaMetrics.current = new PWAMetricsCollector();
    pwaMetrics.current.initialize();

    songbookMetrics.current = new SongbookMetricsCollector();

    performance.current = new PerformanceMonitor();
    performance.current.initialize();

    errors.current = new ErrorTracker();
    errors.current.initialize();

    analytics.current = new UnifiedAnalytics();
    analytics.current.addProvider(new GA4Provider());
    analytics.current.addProvider(new BackendProvider());

    return () => {
      // Cleanup
      performance.current?.cleanup();
    };
  }, []);

  return {
    trackSongView: (songId: string, arrangementId?: string) => {
      songbookMetrics.current?.trackSongView(songId, arrangementId);
      analytics.current?.track('song_view', 'engagement', { songId, arrangementId });
    },

    trackSearch: (query: string, resultsCount: number) => {
      songbookMetrics.current?.trackSearch(query, resultsCount);
      analytics.current?.track('search', 'engagement', { query, resultsCount });
    },

    trackTransposition: (fromKey: string, toKey: string, songId: string) => {
      songbookMetrics.current?.trackTransposition(fromKey, toKey, songId);
      analytics.current?.track('transposition', 'feature', { fromKey, toKey, songId });
    },

    markPerformance: (name: string, action: 'start' | 'end') => {
      if (action === 'start') {
        performance.current?.markStart(name);
      } else {
        performance.current?.markEnd(name);
      }
    },

    reportError: (error: Error, context?: any) => {
      errors.current?.reportError({
        message: error.message,
        stack: error.stack,
        type: 'custom',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        isOffline: !navigator.onLine,
        ...context
      });
    }
  };
}
```

## Key Metrics to Track

### Performance Metrics
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Time to Interactive**: < 3s on 3G
- **Cache Hit Rate**: > 80%
- **Offline Page Load Time**: < 1s

### Engagement Metrics
- **Install Rate**: > 20% of eligible users
- **Daily Active Users**: Track unique daily users
- **Session Duration**: Average time in app
- **Feature Usage**: Track key feature adoption

### Reliability Metrics
- **Sync Success Rate**: > 95%
- **Error Rate**: < 1% of sessions
- **Offline Usage**: % of offline sessions
- **Update Adoption**: % updated within 48h

## Best Practices

### DO:
- ✅ Use batching to reduce network requests
- ✅ Implement sampling for high-frequency events
- ✅ Use sendBeacon for reliability
- ✅ Track both online and offline metrics
- ✅ Monitor storage quota for metrics data
- ✅ Provide opt-out for privacy

### DON'T:
- ❌ Track personally identifiable information
- ❌ Send metrics on every event (batch instead)
- ❌ Block UI for metrics collection
- ❌ Ignore error tracking
- ❌ Forget to clean up observers

## References
- [Web Vitals](https://web.dev/articles/vitals)
- [PWA Metrics](https://web.dev/articles/pwa-analytics)
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)