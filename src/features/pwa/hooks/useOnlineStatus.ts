// Online/offline status detection hook
import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/logger';

/**
 * Network Connection interface extending Navigator
 */
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

/**
 * Extended Navigator interface with connection properties
 */
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Connection information interface
 */
export interface ConnectionInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

/**
 * Return type for useOnlineStatus hook
 */
export interface UseOnlineStatusReturn {
  isOnline: boolean;
  lastOnlineTime: number;
  lastOfflineTime: number | null;
  checkConnection: () => Promise<boolean>;
  getConnectionInfo: () => ConnectionInfo;
  getOfflineDuration: () => number | null;
  getTimeSinceLastOnline: () => number;
}

/**
 * Hook for detecting and managing online/offline status
 * @returns Online status and utilities
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<number>(Date.now());
  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(null);

  // Handle going online
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    logger.log('Connection restored');

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('connection-restored', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineTime(Date.now());
    logger.log('Connection lost');

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
    const checkConnectivity = async (): Promise<void> => {
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
   * @returns True if online, false if offline
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
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
   * @returns Connection information
   */
  const getConnectionInfo = useCallback((): ConnectionInfo => {
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false
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
   * @returns Milliseconds offline, or null if online
   */
  const getOfflineDuration = useCallback((): number | null => {
    if (isOnline || !lastOfflineTime) {
      return null;
    }
    return Date.now() - lastOfflineTime;
  }, [isOnline, lastOfflineTime]);

  /**
   * Get time since last online
   * @returns Milliseconds since last online
   */
  const getTimeSinceLastOnline = useCallback((): number => {
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
 * Queue item interface for retry operations
 */
interface RetryQueueItem<T = unknown> {
  id: number;
  operation: () => Promise<T>;
  options: ExecuteOptions;
  attempts: number;
  maxRetries: number;
  retryDelay: number;
  resolve?: (value: T) => void;
  reject?: (reason?: unknown) => void;
}

/**
 * Options for executeWhenOnline
 */
export interface ExecuteOptions {
  maxRetries?: number;
  retryDelay?: number;
  immediate?: boolean;
}

/**
 * Return type for useConnectionManager hook
 */
export interface UseConnectionManagerReturn {
  executeWhenOnline: <T = unknown>(
    operation: () => Promise<T>,
    options?: ExecuteOptions
  ) => Promise<T>;
  retryQueueSize: number;
  clearRetryQueue: () => void;
}

/**
 * Hook for managing connection-dependent operations
 * @returns Connection utilities
 */
export function useConnectionManager(): UseConnectionManagerReturn {
  const { isOnline } = useOnlineStatus();
  const [retryQueue, setRetryQueue] = useState<RetryQueueItem[]>([]);

  /**
   * Execute an operation when online, queue it if offline
   * @param operation - Operation to execute
   * @param options - Options for retry behavior
   * @returns Promise that resolves when operation completes
   */
  const executeWhenOnline = useCallback(async <T = unknown>(
    operation: () => Promise<T>,
    options: ExecuteOptions = {}
  ): Promise<T> => {
    const { maxRetries = 3, retryDelay = 1000, immediate = false } = options;

    if (isOnline || immediate) {
      try {
        return await operation();
      } catch (error) {
        if (!isOnline) {
          // Queue for retry when back online
          const queueItem: RetryQueueItem<T> = {
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
      return new Promise<T>((resolve, reject) => {
        const queueItem: RetryQueueItem<T> = {
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
      const processQueue = async (): Promise<void> => {
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
 * Operation type for bandwidth-aware operations
 */
export type OperationType = 'low' | 'medium' | 'high';

/**
 * Return type for useBandwidthAware hook
 */
export interface UseBandwidthAwareReturn {
  connectionType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  isSlowConnection: boolean;
  shouldProceedWithOperation: (operationType: OperationType) => boolean;
}

/**
 * Hook for bandwidth-aware operations
 * @returns Bandwidth utilities
 */
export function useBandwidthAware(): UseBandwidthAwareReturn {
  const { isOnline, getConnectionInfo } = useOnlineStatus();
  const [connectionType, setConnectionType] = useState<'4g' | '3g' | '2g' | 'slow-2g' | 'unknown'>('unknown');

  useEffect(() => {
    const updateConnectionType = (): void => {
      const info = getConnectionInfo();
      setConnectionType(info.effectiveType);
    };

    updateConnectionType();

    // Listen for connection changes
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', updateConnectionType);
      return () => {
        if (connection.removeEventListener) {
          connection.removeEventListener('change', updateConnectionType);
        }
      };
    }
  }, [getConnectionInfo]);

  /**
   * Check if operation should be performed based on connection quality
   * @param operationType - 'low', 'medium', 'high' bandwidth requirement
   * @returns True if operation should proceed
   */
  const shouldProceedWithOperation = useCallback((operationType: OperationType): boolean => {
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
