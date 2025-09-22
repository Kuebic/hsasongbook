// PWA testing utilities for development and validation
// Based on PWA testing patterns and best practices

/**
 * PWATestUtils provides utilities for testing PWA functionality
 */
export class PWATestUtils {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run comprehensive PWA tests
   * @returns {Promise<Object>} Test results
   */
  async runPWATests() {
    console.log('Running PWA tests...');
    this.testResults = [];

    const tests = [
      this.testServiceWorkerRegistration,
      this.testManifestPresence,
      this.testOfflineCapability,
      this.testCacheAPI,
      this.testInstallability,
      this.testIndexedDB,
      this.testNotificationAPI,
      this.testBackgroundSync
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.addTestResult(test.name, false, error.message);
      }
    }

    return this.getTestSummary();
  }

  /**
   * Test service worker registration
   */
  async testServiceWorkerRegistration() {
    const testName = 'Service Worker Registration';

    if (!('serviceWorker' in navigator)) {
      this.addTestResult(testName, false, 'Service Worker API not supported');
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        this.addTestResult(testName, false, 'No service worker registered');
        return;
      }

      const registration = registrations[0];
      const hasActiveWorker = registration.active !== null;
      const isControlling = navigator.serviceWorker.controller !== null;

      this.addTestResult(testName, hasActiveWorker && isControlling,
        `Active: ${hasActiveWorker}, Controlling: ${isControlling}`);
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test web app manifest presence and validity
   */
  async testManifestPresence() {
    const testName = 'Web App Manifest';

    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        this.addTestResult(testName, false, 'No manifest link found in HTML');
        return;
      }

      const response = await fetch(manifestLink.href);
      if (!response.ok) {
        this.addTestResult(testName, false, `Manifest fetch failed: ${response.status}`);
        return;
      }

      const manifest = await response.json();
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);

      if (missingFields.length > 0) {
        this.addTestResult(testName, false, `Missing fields: ${missingFields.join(', ')}`);
        return;
      }

      // Check icon sizes
      const hasValidIcons = manifest.icons.some(icon =>
        icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
      );

      this.addTestResult(testName, hasValidIcons,
        hasValidIcons ? 'Valid manifest with appropriate icons' : 'No valid icon sizes found');
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test offline capability
   */
  async testOfflineCapability() {
    const testName = 'Offline Capability';

    if (!('caches' in window)) {
      this.addTestResult(testName, false, 'Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      if (cacheNames.length === 0) {
        this.addTestResult(testName, false, 'No caches found');
        return;
      }

      // Test if current page is cached
      const cache = await caches.open(cacheNames[0]);
      const cachedResponse = await cache.match(window.location.href);

      this.addTestResult(testName, !!cachedResponse,
        cachedResponse ? 'Current page is cached' : 'Current page not in cache');
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test Cache API functionality
   */
  async testCacheAPI() {
    const testName = 'Cache API';

    if (!('caches' in window)) {
      this.addTestResult(testName, false, 'Cache API not supported');
      return;
    }

    try {
      const testCacheName = 'pwa-test-cache';
      const testUrl = '/test-cache-url';
      const testResponse = new Response('test data');

      // Open cache
      const cache = await caches.open(testCacheName);

      // Add to cache
      await cache.put(testUrl, testResponse.clone());

      // Retrieve from cache
      const cachedResponse = await cache.match(testUrl);
      const cachedText = await cachedResponse.text();

      // Cleanup
      await caches.delete(testCacheName);

      this.addTestResult(testName, cachedText === 'test data',
        'Cache put/get operations successful');
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test PWA installability
   */
  async testInstallability() {
    const testName = 'PWA Installability';

    // Check for beforeinstallprompt support
    const hasInstallPrompt = 'BeforeInstallPromptEvent' in window;

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;

    // Check for related_applications in manifest
    let hasRelatedApps = false;
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.href);
        const manifest = await response.json();
        hasRelatedApps = manifest.related_applications &&
                        manifest.related_applications.length > 0;
      }
    } catch {
      // Ignore manifest fetch errors for this test
    }

    const installable = hasInstallPrompt || isStandalone;
    this.addTestResult(testName, installable,
      `Standalone: ${isStandalone}, InstallPrompt: ${hasInstallPrompt}, RelatedApps: ${hasRelatedApps}`);
  }

  /**
   * Test IndexedDB functionality
   */
  async testIndexedDB() {
    const testName = 'IndexedDB';

    if (!('indexedDB' in window)) {
      this.addTestResult(testName, false, 'IndexedDB not supported');
      return;
    }

    try {
      const dbName = 'pwa-test-db';
      const request = indexedDB.open(dbName, 1);

      await new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const store = db.createObjectStore('test', { keyPath: 'id' });
          store.add({ id: 1, data: 'test' });
        };
      });

      // Cleanup
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      await new Promise((resolve) => {
        deleteRequest.onsuccess = resolve;
        deleteRequest.onerror = resolve; // Don't fail on cleanup
      });

      this.addTestResult(testName, true, 'IndexedDB operations successful');
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test Notification API
   */
  async testNotificationAPI() {
    const testName = 'Notification API';

    if (!('Notification' in window)) {
      this.addTestResult(testName, false, 'Notification API not supported');
      return;
    }

    const permission = Notification.permission;
    const supported = permission !== undefined;

    this.addTestResult(testName, supported,
      `Permission: ${permission}, Supported: ${supported}`);
  }

  /**
   * Test Background Sync capability
   */
  async testBackgroundSync() {
    const testName = 'Background Sync';

    if (!('serviceWorker' in navigator)) {
      this.addTestResult(testName, false, 'Service Worker required for Background Sync');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const hasBackgroundSync = 'sync' in registration;

      this.addTestResult(testName, hasBackgroundSync,
        hasBackgroundSync ? 'Background Sync API available' : 'Background Sync not supported');
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test network conditions
   * @returns {Promise<Object>} Network test results
   */
  async testNetworkConditions() {
    const results = {
      online: navigator.onLine,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: null,
      rtt: null,
      saveData: false
    };

    // Test Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      results.connectionType = connection.type || 'unknown';
      results.effectiveType = connection.effectiveType || 'unknown';
      results.downlink = connection.downlink || null;
      results.rtt = connection.rtt || null;
      results.saveData = connection.saveData || false;
    }

    // Test actual connectivity
    try {
      const start = Date.now();
      const response = await fetch('/favicon.ico?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store'
      });
      const duration = Date.now() - start;

      results.actuallyOnline = response.ok;
      results.pingTime = duration;
    } catch (error) {
      results.actuallyOnline = false;
      results.pingTime = null;
      results.networkError = error.message;
    }

    return results;
  }

  /**
   * Simulate offline conditions
   * @param {Function} testFunction - Function to test while offline
   * @returns {Promise<Object>} Test results
   */
  async simulateOffline(testFunction) {
    console.log('Simulating offline conditions...');

    // Note: This doesn't actually take the browser offline
    // It simulates the navigator.onLine state for testing
    const originalOnLine = navigator.onLine;

    try {
      // Override navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });

      // Dispatch offline event
      window.dispatchEvent(new Event('offline'));

      // Run the test function
      const result = await testFunction();

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      // Restore original state
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine,
        configurable: true
      });

      // Dispatch online event if we were originally online
      if (originalOnLine) {
        window.dispatchEvent(new Event('online'));
      }
    }
  }

  /**
   * Test performance metrics
   * @returns {Object} Performance test results
   */
  testPerformanceMetrics() {
    const results = {
      performanceAPI: 'performance' in window,
      navigationTiming: 'PerformanceNavigationTiming' in window,
      resourceTiming: 'PerformanceResourceTiming' in window,
      userTiming: 'PerformanceMark' in window && 'PerformanceMeasure' in window,
      observer: 'PerformanceObserver' in window
    };

    if (results.performanceAPI && results.navigationTiming) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        results.loadTime = navigation.loadEventEnd - navigation.navigationStart;
        results.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        results.firstByte = navigation.responseStart - navigation.navigationStart;
      }
    }

    return results;
  }

  /**
   * Add test result
   * @param {string} name - Test name
   * @param {boolean} passed - Whether test passed
   * @param {string} details - Additional details
   */
  addTestResult(name, passed, details) {
    this.testResults.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    });

    console.log(`${passed ? '✅' : '❌'} ${name}: ${details}`);
  }

  /**
   * Get test summary
   * @returns {Object} Test summary
   */
  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(result => result.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      results: this.testResults,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate PWA compliance report
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport() {
    const testResults = await this.runPWATests();
    const networkTest = await this.testNetworkConditions();
    const performanceTest = this.testPerformanceMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      overallScore: testResults.passRate,
      compliance: {
        basic: this.calculateBasicCompliance(testResults),
        advanced: this.calculateAdvancedCompliance(testResults),
        optimal: this.calculateOptimalCompliance(testResults)
      },
      tests: testResults,
      network: networkTest,
      performance: performanceTest,
      recommendations: this.generateRecommendations(testResults)
    };

    return report;
  }

  /**
   * Calculate basic PWA compliance
   * @param {Object} testResults - Test results
   * @returns {Object} Basic compliance info
   */
  calculateBasicCompliance(testResults) {
    const basicTests = ['Service Worker Registration', 'Web App Manifest', 'Offline Capability'];
    const basicResults = testResults.results.filter(result => basicTests.includes(result.name));
    const passed = basicResults.filter(result => result.passed).length;

    return {
      score: Math.round((passed / basicTests.length) * 100),
      passed: passed === basicTests.length,
      details: basicResults
    };
  }

  /**
   * Calculate advanced PWA compliance
   * @param {Object} testResults - Test results
   * @returns {Object} Advanced compliance info
   */
  calculateAdvancedCompliance(testResults) {
    const advancedTests = ['PWA Installability', 'Cache API', 'IndexedDB'];
    const advancedResults = testResults.results.filter(result => advancedTests.includes(result.name));
    const passed = advancedResults.filter(result => result.passed).length;

    return {
      score: Math.round((passed / advancedTests.length) * 100),
      passed: passed === advancedTests.length,
      details: advancedResults
    };
  }

  /**
   * Calculate optimal PWA compliance
   * @param {Object} testResults - Test results
   * @returns {Object} Optimal compliance info
   */
  calculateOptimalCompliance(testResults) {
    const optimalTests = ['Background Sync', 'Notification API'];
    const optimalResults = testResults.results.filter(result => optimalTests.includes(result.name));
    const passed = optimalResults.filter(result => result.passed).length;

    return {
      score: optimalTests.length > 0 ? Math.round((passed / optimalTests.length) * 100) : 100,
      passed: passed === optimalTests.length || optimalTests.length === 0,
      details: optimalResults
    };
  }

  /**
   * Generate recommendations based on test results
   * @param {Object} testResults - Test results
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(testResults) {
    const recommendations = [];
    const failedTests = testResults.results.filter(result => !result.passed);

    failedTests.forEach(test => {
      switch (test.name) {
        case 'Service Worker Registration':
          recommendations.push({
            priority: 'high',
            category: 'PWA Core',
            issue: 'Service Worker not registered',
            recommendation: 'Register a service worker to enable offline functionality'
          });
          break;

        case 'Web App Manifest':
          recommendations.push({
            priority: 'high',
            category: 'PWA Core',
            issue: 'Invalid or missing manifest',
            recommendation: 'Create a valid web app manifest with required fields'
          });
          break;

        case 'Offline Capability':
          recommendations.push({
            priority: 'medium',
            category: 'Performance',
            issue: 'No offline capability detected',
            recommendation: 'Implement caching strategies in service worker'
          });
          break;

        case 'PWA Installability':
          recommendations.push({
            priority: 'medium',
            category: 'User Experience',
            issue: 'App is not installable',
            recommendation: 'Ensure manifest is valid and HTTPS is used'
          });
          break;

        case 'IndexedDB':
          recommendations.push({
            priority: 'low',
            category: 'Data Storage',
            issue: 'IndexedDB not working',
            recommendation: 'Implement IndexedDB for offline data storage'
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * Clear all test results
   */
  clearResults() {
    this.testResults = [];
  }

  /**
   * Export test results to JSON
   * @returns {string} JSON string of test results
   */
  exportResults() {
    return JSON.stringify(this.getTestSummary(), null, 2);
  }
}