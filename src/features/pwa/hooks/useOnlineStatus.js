// Online/offline status detection hook
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for detecting and managing online/offline status
 * @returns {Object} Online status and utilities
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [lastOfflineTime, setLastOfflineTime] = useState(null);

  // Handle going online
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    console.log('Connection restored');

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('connection-restored', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineTime(Date.now());
    console.log('Connection lost');

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('connection-lost', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  useEffect(() => {
    // Set up event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check to catch cases where navigator.onLine
    // might not be accurate (some browsers don't update it reliably)
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify actual connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/favicon.ico?' + Date.now(), {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const actuallyOnline = response.ok;
        if (actuallyOnline !== isOnline) {
          if (actuallyOnline) {
            handleOnline();
          } else {
            handleOffline();
          }
        }
      } catch {
        // If fetch fails, we're likely offline
        if (isOnline) {
          handleOffline();
        }
      }
    };

    // Check connectivity every 30 seconds
    const connectivityInterval = setInterval(checkConnectivity, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, [handleOnline, handleOffline, isOnline]);

  /**
   * Manually check connectivity status
   * @returns {Promise<boolean>} True if online, false if offline
   */
  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/favicon.ico?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const connected = response.ok;

      // Update state if different
      if (connected !== isOnline) {
        if (connected) {
          handleOnline();
        } else {
          handleOffline();
        }
      }

      return connected;
    } catch {
      if (isOnline) {
        handleOffline();
      }
      return false;
    }
  }, [isOnline, handleOnline, handleOffline]);

  /**
   * Get connection quality info
   * @returns {Object} Connection information
   */
  const getConnectionInfo = useCallback(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // milliseconds
        saveData: connection.saveData // boolean
      };
    }

    return {
      effectiveType: 'unknown',
      downlink: null,
      rtt: null,
      saveData: false
    };
  }, []);

  /**
   * Get offline duration if currently offline
   * @returns {number|null} Milliseconds offline, or null if online
   */
  const getOfflineDuration = useCallback(() => {
    if (isOnline || !lastOfflineTime) {
      return null;
    }
    return Date.now() - lastOfflineTime;
  }, [isOnline, lastOfflineTime]);

  /**
   * Get time since last online
   * @returns {number} Milliseconds since last online
   */
  const getTimeSinceLastOnline = useCallback(() => {
    return Date.now() - lastOnlineTime;
  }, [lastOnlineTime]);

  return {
    isOnline,
    lastOnlineTime,
    lastOfflineTime,
    checkConnection,
    getConnectionInfo,
    getOfflineDuration,
    getTimeSinceLastOnline
  };
}

/**
 * Hook for managing connection-dependent operations
 * @returns {Object} Connection utilities
 */
export function useConnectionManager() {
  const { isOnline } = useOnlineStatus();
  const [retryQueue, setRetryQueue] = useState([]);

  /**
   * Execute an operation when online, queue it if offline
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Options for retry behavior
   * @returns {Promise} Promise that resolves when operation completes
   */
  const executeWhenOnline = useCallback(async (operation, options = {}) => {
    const { maxRetries = 3, retryDelay = 1000, immediate = false } = options;

    if (isOnline || immediate) {
      try {
        return await operation();
      } catch (error) {
        if (!isOnline) {
          // Queue for retry when back online
          const queueItem = {
            id: Date.now() + Math.random(),
            operation,
            options,
            attempts: 0,
            maxRetries,
            retryDelay
          };
          setRetryQueue(prev => [...prev, queueItem]);
        }
        throw error;
      }
    } else {
      // Queue for when we're back online
      return new Promise((resolve, reject) => {
        const queueItem = {
          id: Date.now() + Math.random(),
          operation,
          options,
          attempts: 0,
          maxRetries,
          retryDelay,
          resolve,
          reject
        };
        setRetryQueue(prev => [...prev, queueItem]);
      });
    }
  }, [isOnline]);

  /**
   * Process the retry queue when coming back online
   */
  useEffect(() => {
    if (isOnline && retryQueue.length > 0) {
      const processQueue = async () => {
        const currentQueue = [...retryQueue];
        setRetryQueue([]);

        for (const item of currentQueue) {
          try {
            const result = await item.operation();
            if (item.resolve) {
              item.resolve(result);
            }
          } catch (error) {
            item.attempts++;
            if (item.attempts < item.maxRetries) {
              // Re-queue with delay
              setTimeout(() => {
                setRetryQueue(prev => [...prev, item]);
              }, item.retryDelay * item.attempts);
            } else if (item.reject) {
              item.reject(error);
            }
          }
        }
      };

      processQueue();
    }
  }, [isOnline, retryQueue]);

  /**
   * Clear the retry queue
   */
  const clearRetryQueue = useCallback(() => {
    setRetryQueue([]);
  }, []);

  return {
    executeWhenOnline,
    retryQueueSize: retryQueue.length,
    clearRetryQueue
  };
}

/**
 * Hook for bandwidth-aware operations
 * @returns {Object} Bandwidth utilities
 */
export function useBandwidthAware() {
  const { isOnline, getConnectionInfo } = useOnlineStatus();
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const updateConnectionType = () => {
      const info = getConnectionInfo();
      setConnectionType(info.effectiveType);
    };

    updateConnectionType();

    // Listen for connection changes
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
      return () => connection.removeEventListener('change', updateConnectionType);
    }
  }, [getConnectionInfo]);

  /**
   * Check if operation should be performed based on connection quality
   * @param {string} operationType - 'low', 'medium', 'high' bandwidth requirement
   * @returns {boolean} True if operation should proceed
   */
  const shouldProceedWithOperation = useCallback((operationType) => {
    if (!isOnline) return false;

    const connectionInfo = getConnectionInfo();

    // Respect data saver mode
    if (connectionInfo.saveData) {
      return operationType === 'low';
    }

    switch (connectionType) {
      case 'slow-2g':
        return operationType === 'low';
      case '2g':
        return operationType === 'low';
      case '3g':
        return operationType === 'low' || operationType === 'medium';
      case '4g':
        return true; // All operations allowed
      default:
        return operationType === 'low'; // Conservative approach
    }
  }, [isOnline, connectionType, getConnectionInfo]);

  return {
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    shouldProceedWithOperation
  };
}