// Performance monitoring and metrics for PWA
// Based on patterns from PRPs/ai_docs/pwa-metrics-tracking.md

import logger from '@/lib/logger';
import { getConfig } from '@/lib/config/environment.js';

/**
 * PWAPerformance class for tracking PWA-specific performance metrics
 *
 * Usage:
 *   const monitor = new PWAPerformance();
 *   // ... use monitor
 *   monitor.cleanup(); // IMPORTANT: Always cleanup when done
 *
 * React Usage:
 *   useEffect(() => {
 *     const monitor = new PWAPerformance();
 *     return () => monitor.cleanup();
 *   }, []);
 *
 * Singleton Usage:
 *   const monitor = PWAPerformance.getInstance();
 *   // ... use monitor
 *   PWAPerformance.destroyInstance(); // When done
 */
export class PWAPerformance {
  static instance = null;

  constructor() {
    // Implement singleton pattern to prevent multiple instances
    if (PWAPerformance.instance) {
      return PWAPerformance.instance;
    }

    // Load configuration
    const config = getConfig();
    this.performanceConfig = config.performance;

    this.metrics = {
      webVitals: {},
      pwaMetrics: {},
      networkMetrics: {},
      cacheMetrics: {}
    };
    this.observers = [];
    this.startTime = Date.now();
    this.setupPerformanceObserver();

    // Store singleton instance
    PWAPerformance.instance = this;
  }

  /**
   * Get or create singleton instance
   * @returns {PWAPerformance} The singleton instance
   */
  static getInstance() {
    if (!PWAPerformance.instance) {
      PWAPerformance.instance = new PWAPerformance();
    }
    return PWAPerformance.instance;
  }

  /**
   * Destroy singleton instance
   */
  static destroyInstance() {
    if (PWAPerformance.instance) {
      PWAPerformance.instance.cleanup();
      PWAPerformance.instance = null;
    }
  }

  /**
   * Initialize performance monitoring
   */
  setupPerformanceObserver() {
    // Safety check: cleanup any existing observers first
    if (this.observers.length > 0) {
      logger.warn('Cleaning up existing observers before re-initialization');
      this.cleanup();
    }

    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry);
        }
      });
      navigationObserver.observe({ type: 'navigation', buffered: true });
      this.observers.push(navigationObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processResourceEntry(entry);
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.push(resourceObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.webVitals.lcp = entry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.webVitals.fid = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.webVitals.cls = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);

    } catch (error) {
      console.error('Error setting up performance observers:', error);
    }
  }

  /**
   * Process navigation timing entry
   * @param {PerformanceNavigationTiming} entry - Navigation timing entry
   */
  processNavigationEntry(entry) {
    this.metrics.pwaMetrics = {
      ...this.metrics.pwaMetrics,
      ttfb: entry.responseStart - entry.requestStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
      domInteractive: entry.domInteractive - entry.navigationStart
    };
  }

  /**
   * Process resource timing entry
   * @param {PerformanceResourceTiming} entry - Resource timing entry
   */
  processResourceEntry(entry) {
    const resourceType = this.getResourceType(entry);

    // Track cache hits/misses
    const wasCached = entry.transferSize === 0 && entry.decodedBodySize > 0;

    if (!this.metrics.cacheMetrics[resourceType]) {
      this.metrics.cacheMetrics[resourceType] = { hits: 0, misses: 0, total: 0 };
    }

    this.metrics.cacheMetrics[resourceType].total++;
    if (wasCached) {
      this.metrics.cacheMetrics[resourceType].hits++;
    } else {
      this.metrics.cacheMetrics[resourceType].misses++;
    }

    // Track network timing
    if (!wasCached) {
      if (!this.metrics.networkMetrics[resourceType]) {
        this.metrics.networkMetrics[resourceType] = {
          count: 0,
          totalDuration: 0,
          totalSize: 0,
          averageDuration: 0,
          averageSize: 0
        };
      }

      const duration = entry.responseEnd - entry.requestStart;
      const size = entry.transferSize || 0;

      const metric = this.metrics.networkMetrics[resourceType];
      metric.count++;
      metric.totalDuration += duration;
      metric.totalSize += size;
      metric.averageDuration = metric.totalDuration / metric.count;
      metric.averageSize = metric.totalSize / metric.count;
    }
  }

  /**
   * Determine resource type from performance entry
   * @param {PerformanceResourceTiming} entry - Resource timing entry
   * @returns {string} Resource type
   */
  getResourceType(entry) {
    const url = entry.name.toLowerCase();

    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)/)) return 'image';
    if (url.includes('/api/')) return 'api';
    if (url.includes('font')) return 'font';

    return 'other';
  }

  /**
   * Measure First Contentful Paint manually
   * @returns {number|null} FCP time or null
   */
  measureFCP() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : null;
    } catch (error) {
      console.error('Error measuring FCP:', error);
      return null;
    }
  }

  /**
   * Track PWA installation metrics
   * @param {string} method - Installation method ('browser', 'manual', 'prompt')
   */
  trackInstallation(method) {
    this.metrics.pwaMetrics.installationMethod = method;
    this.metrics.pwaMetrics.installationTime = Date.now();
    this.metrics.pwaMetrics.timeToInstall = Date.now() - this.startTime;

    // Send to analytics if available
    this.sendEvent('pwa_install', {
      method,
      time_to_install: this.metrics.pwaMetrics.timeToInstall
    });
  }

  /**
   * Track offline usage
   * @param {string} action - Action performed offline
   * @param {number} duration - Duration of offline period
   */
  trackOfflineUsage(action, duration) {
    if (!this.metrics.pwaMetrics.offlineUsage) {
      this.metrics.pwaMetrics.offlineUsage = {
        sessions: 0,
        totalDuration: 0,
        actions: {}
      };
    }

    this.metrics.pwaMetrics.offlineUsage.sessions++;
    this.metrics.pwaMetrics.offlineUsage.totalDuration += duration;

    if (!this.metrics.pwaMetrics.offlineUsage.actions[action]) {
      this.metrics.pwaMetrics.offlineUsage.actions[action] = 0;
    }
    this.metrics.pwaMetrics.offlineUsage.actions[action]++;

    this.sendEvent('offline_usage', {
      action,
      duration,
      total_sessions: this.metrics.pwaMetrics.offlineUsage.sessions
    });
  }

  /**
   * Track service worker performance
   * @param {string} event - SW event type
   * @param {number} duration - Event duration
   */
  trackServiceWorkerPerformance(event, duration) {
    if (!this.metrics.pwaMetrics.serviceWorker) {
      this.metrics.pwaMetrics.serviceWorker = {};
    }

    if (!this.metrics.pwaMetrics.serviceWorker[event]) {
      this.metrics.pwaMetrics.serviceWorker[event] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0
      };
    }

    const metric = this.metrics.pwaMetrics.serviceWorker[event];
    metric.count++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.count;
  }

  /**
   * Calculate cache hit rate
   * @param {string} resourceType - Type of resource (optional)
   * @returns {number} Cache hit rate as percentage
   */
  getCacheHitRate(resourceType = null) {
    let hits = 0;
    let total = 0;

    if (resourceType && this.metrics.cacheMetrics[resourceType]) {
      const metric = this.metrics.cacheMetrics[resourceType];
      hits = metric.hits;
      total = metric.total;
    } else {
      // Calculate overall hit rate
      for (const metric of Object.values(this.metrics.cacheMetrics)) {
        hits += metric.hits;
        total += metric.total;
      }
    }

    return total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Get Web Vitals score
   * @returns {Object} Web Vitals metrics with ratings
   */
  getWebVitalsScore() {
    const vitals = this.metrics.webVitals;
    const fcp = this.measureFCP();

    return {
      fcp: {
        value: fcp,
        rating: this.rateMetric('fcp', fcp)
      },
      lcp: {
        value: vitals.lcp,
        rating: this.rateMetric('lcp', vitals.lcp)
      },
      fid: {
        value: vitals.fid,
        rating: this.rateMetric('fid', vitals.fid)
      },
      cls: {
        value: vitals.cls,
        rating: this.rateMetric('cls', vitals.cls)
      }
    };
  }

  /**
   * Rate a metric as good, needs improvement, or poor
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @returns {string} Rating
   */
  rateMetric(metric, value) {
    if (value === null || value === undefined) return 'unknown';

    const config = getConfig();
    const threshold = config.performance.webVitals[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const webVitals = this.getWebVitalsScore();
    const cacheHitRate = this.getCacheHitRate();

    return {
      timestamp: new Date().toISOString(),
      webVitals,
      cacheHitRate,
      offlineCapable: 'serviceWorker' in navigator,
      installable: this.metrics.pwaMetrics.installationMethod !== undefined,
      networkEfficiency: this.calculateNetworkEfficiency(),
      overallScore: this.calculateOverallScore(webVitals, cacheHitRate)
    };
  }

  /**
   * Calculate network efficiency score
   * @returns {number} Efficiency score (0-100)
   */
  calculateNetworkEfficiency() {
    const cacheHitRate = this.getCacheHitRate();
    let networkScore = cacheHitRate;

    // Adjust based on average response times
    const apiMetrics = this.metrics.networkMetrics.api;
    if (apiMetrics && apiMetrics.averageDuration) {
      const config = getConfig();
      if (apiMetrics.averageDuration < config.performance.network.fastResponseMs) {
        networkScore += 10;
      } else if (apiMetrics.averageDuration > config.performance.network.slowResponseMs) {
        networkScore -= 20;
      }
    }

    return Math.max(0, Math.min(100, networkScore));
  }

  /**
   * Calculate overall performance score
   * @param {Object} webVitals - Web vitals metrics
   * @param {number} cacheHitRate - Cache hit rate
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(webVitals, cacheHitRate) {
    let score = 0;
    let validMetrics = 0;

    // Score Web Vitals (60% of score)
    for (const [, data] of Object.entries(webVitals)) {
      if (data.value !== null && data.value !== undefined) {
        validMetrics++;
        switch (data.rating) {
          case 'good': score += 25; break;
          case 'needs-improvement': score += 15; break;
          case 'poor': score += 5; break;
        }
      }
    }

    // Score cache performance (40% of score)
    if (cacheHitRate >= 80) score += 20;
    else if (cacheHitRate >= 60) score += 15;
    else if (cacheHitRate >= 40) score += 10;
    else score += 5;

    return validMetrics > 0 ? Math.round(score / (validMetrics + 1) * 100 / 25) : 0;
  }

  /**
   * Send analytics event
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  sendEvent(eventName, properties) {
    // Placeholder for analytics integration
    logger.log('Analytics Event:', eventName, properties);

    // In a real implementation, this would send to your analytics service
    // Examples: Google Analytics, Mixpanel, custom analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }

  /**
   * Export metrics for external analysis
   * @returns {Object} All collected metrics
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
      ...this.metrics,
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Start measuring a custom performance mark
   * @param {string} name - Mark name
   */
  startMeasure(name) {
    try {
      performance.mark(`${name}-start`);
    } catch (error) {
      console.error('Error starting performance measure:', error);
    }
  }

  /**
   * End measuring a custom performance mark
   * @param {string} name - Mark name
   * @returns {number|null} Duration in milliseconds
   */
  endMeasure(name) {
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measures = performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];

      return lastMeasure ? lastMeasure.duration : null;
    } catch (error) {
      console.error('Error ending performance measure:', error);
      return null;
    }
  }

  /**
   * Clean up performance observers and reset state
   */
  cleanup() {
    // Disconnect all observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.error('Error disconnecting performance observer:', error);
      }
    });

    // Clear the observers array
    this.observers = [];

    // Clear any pending measurements
    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch (error) {
      console.error('Error clearing performance marks:', error);
    }

    // Reset singleton instance if using singleton pattern
    if (PWAPerformance.instance === this) {
      PWAPerformance.instance = null;
    }

    logger.log('Performance monitoring cleaned up');
  }
}