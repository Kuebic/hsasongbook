// Cache management utilities for PWA
// Based on patterns from PRPs/ai_docs/pwa-caching-strategies.md

/**
 * CacheManager provides utilities for managing caches in the PWA
 */
export class CacheManager {
  constructor() {
    this.cacheNames = {
      static: 'hsasongbook-static-v1',
      dynamic: 'hsasongbook-dynamic-v1',
      api: 'hsasongbook-api-v1',
      images: 'hsasongbook-images-v1'
    };
  }

  /**
   * Get cache hit rate statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    if (!('caches' in window)) {
      return { supported: false };
    }

    const stats = {
      supported: true,
      caches: {},
      totalSize: 0,
      totalEntries: 0
    };

    for (const [name, cacheName] of Object.entries(this.cacheNames)) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const cacheStats = {
          entries: requests.length,
          size: 0,
          urls: []
        };

        // Calculate approximate size and collect URLs
        for (const request of requests) {
          cacheStats.urls.push(request.url);
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              cacheStats.size += blob.size;
            }
          } catch (error) {
            console.warn('Error reading cache entry:', error);
          }
        }

        stats.caches[name] = cacheStats;
        stats.totalSize += cacheStats.size;
        stats.totalEntries += cacheStats.entries;
      } catch (error) {
        console.error(`Error reading cache ${cacheName}:`, error);
        stats.caches[name] = { error: error.message };
      }
    }

    return stats;
  }

  /**
   * Clear all application caches
   * @returns {Promise<void>}
   */
  async clearAllCaches() {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return;
    }

    const deletedCaches = [];
    for (const cacheName of Object.values(this.cacheNames)) {
      try {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          deletedCaches.push(cacheName);
        }
      } catch (error) {
        console.error(`Error deleting cache ${cacheName}:`, error);
      }
    }

    console.log(`Cleared ${deletedCaches.length} caches:`, deletedCaches);
  }

  /**
   * Clear specific cache
   * @param {string} cacheType - Type of cache to clear
   * @returns {Promise<boolean>} True if cache was deleted
   */
  async clearCache(cacheType) {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return false;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      console.error(`Unknown cache type: ${cacheType}`);
      return false;
    }

    try {
      const deleted = await caches.delete(cacheName);
      console.log(`Cache ${cacheName} ${deleted ? 'deleted' : 'not found'}`);
      return deleted;
    } catch (error) {
      console.error(`Error deleting cache ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Preload specific URLs into cache
   * @param {Array} urls - URLs to preload
   * @param {string} cacheType - Type of cache to use
   * @returns {Promise<Object>} Results of preload operation
   */
  async preloadUrls(urls, cacheType = 'dynamic') {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return { success: [], failed: urls };
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      console.error(`Unknown cache type: ${cacheType}`);
      return { success: [], failed: urls };
    }

    const results = { success: [], failed: [] };

    try {
      const cache = await caches.open(cacheName);

      await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              results.success.push(url);
            } else {
              results.failed.push(url);
            }
          } catch (error) {
            console.error(`Failed to preload ${url}:`, error);
            results.failed.push(url);
          }
        })
      );
    } catch (error) {
      console.error('Error opening cache for preload:', error);
      results.failed = urls;
    }

    console.log(`Preloaded ${results.success.length}/${urls.length} URLs`);
    return results;
  }

  /**
   * Check if URL is cached
   * @param {string} url - URL to check
   * @param {string} cacheType - Type of cache to check
   * @returns {Promise<boolean>} True if URL is cached
   */
  async isCached(url, cacheType = 'dynamic') {
    if (!('caches' in window)) {
      return false;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      return !!response;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get cached response for URL
   * @param {string} url - URL to get from cache
   * @param {string} cacheType - Type of cache to check
   * @returns {Promise<Response|null>} Cached response or null
   */
  async getCachedResponse(url, cacheType = 'dynamic') {
    if (!('caches' in window)) {
      return null;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      return null;
    }

    try {
      const cache = await caches.open(cacheName);
      return await cache.match(url);
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Update cache entry
   * @param {string} url - URL to update
   * @param {Response} response - New response to cache
   * @param {string} cacheType - Type of cache to update
   * @returns {Promise<boolean>} True if successful
   */
  async updateCache(url, response, cacheType = 'dynamic') {
    if (!('caches' in window)) {
      return false;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      await cache.put(url, response);
      return true;
    } catch (error) {
      console.error('Error updating cache:', error);
      return false;
    }
  }

  /**
   * Remove specific URL from cache
   * @param {string} url - URL to remove
   * @param {string} cacheType - Type of cache to remove from
   * @returns {Promise<boolean>} True if removed
   */
  async removeFromCache(url, cacheType = 'dynamic') {
    if (!('caches' in window)) {
      return false;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      const deleted = await cache.delete(url);
      return deleted;
    } catch (error) {
      console.error('Error removing from cache:', error);
      return false;
    }
  }

  /**
   * Cleanup old cache entries
   * @param {string} cacheType - Type of cache to cleanup
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<number>} Number of entries removed
   */
  async cleanupOldEntries(cacheType = 'dynamic', maxAge = 7 * 24 * 60 * 60 * 1000) {
    if (!('caches' in window)) {
      return 0;
    }

    const cacheName = this.cacheNames[cacheType];
    if (!cacheName) {
      return 0;
    }

    let removedCount = 0;
    const cutoffDate = Date.now() - maxAge;

    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            const lastModified = response.headers.get('last-modified');
            const cacheDate = lastModified
              ? new Date(lastModified).getTime()
              : 0;

            if (cacheDate && cacheDate < cutoffDate) {
              await cache.delete(request);
              removedCount++;
            }
          }
        } catch (error) {
          console.warn('Error checking cache entry date:', error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }

    console.log(`Cleaned up ${removedCount} old cache entries from ${cacheType}`);
    return removedCount;
  }

  /**
   * Get cache storage usage information
   * @returns {Promise<Object>} Storage usage info
   */
  async getStorageUsage() {
    const usage = {
      supported: 'storage' in navigator && 'estimate' in navigator.storage,
      quota: 0,
      used: 0,
      available: 0,
      percentage: 0,
      cacheUsage: 0
    };

    if (usage.supported) {
      try {
        const estimate = await navigator.storage.estimate();
        usage.quota = estimate.quota || 0;
        usage.used = estimate.usage || 0;
        usage.available = usage.quota - usage.used;
        usage.percentage = usage.quota > 0 ? (usage.used / usage.quota) * 100 : 0;

        // Try to estimate cache usage specifically
        if ('usageDetails' in estimate && estimate.usageDetails) {
          usage.cacheUsage = estimate.usageDetails.caches || 0;
        }
      } catch (error) {
        console.error('Error getting storage estimate:', error);
      }
    }

    return usage;
  }

  /**
   * Format bytes for human reading
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get comprehensive cache health report
   * @returns {Promise<Object>} Cache health report
   */
  async getCacheHealthReport() {
    const [stats, usage] = await Promise.all([
      this.getCacheStats(),
      this.getStorageUsage()
    ]);

    const report = {
      timestamp: new Date().toISOString(),
      overall: {
        healthy: true,
        warnings: [],
        errors: []
      },
      caches: stats,
      storage: usage
    };

    // Check for potential issues
    if (usage.percentage > 80) {
      report.overall.healthy = false;
      report.overall.warnings.push('Storage usage over 80%');
    }

    if (usage.percentage > 95) {
      report.overall.healthy = false;
      report.overall.errors.push('Storage usage critically high');
    }

    if (stats.totalEntries > 1000) {
      report.overall.warnings.push('Large number of cached entries - consider cleanup');
    }

    // Check for failed caches
    for (const [name, cache] of Object.entries(stats.caches)) {
      if (cache.error) {
        report.overall.healthy = false;
        report.overall.errors.push(`Cache ${name} error: ${cache.error}`);
      }
    }

    return report;
  }

  /**
   * Optimize caches based on usage patterns
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeCaches() {
    const results = {
      cleaned: 0,
      errors: [],
      recommendations: []
    };

    try {
      // Clean up old entries from dynamic cache
      results.cleaned += await this.cleanupOldEntries('dynamic', 7 * 24 * 60 * 60 * 1000);

      // Clean up old API responses
      results.cleaned += await this.cleanupOldEntries('api', 24 * 60 * 60 * 1000);

      // Check storage usage
      const usage = await this.getStorageUsage();
      if (usage.percentage > 70) {
        results.recommendations.push('Consider clearing image cache to free space');
      }

      if (usage.percentage > 85) {
        results.recommendations.push('Critical: Clear old caches immediately');
        // Automatically clear image cache if very high usage
        await this.clearCache('images');
        results.cleaned += 1;
      }

    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }
}