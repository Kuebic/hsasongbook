// Main PWA hook for service worker management and PWA state
import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

/**
 * Platform types for PWA installation
 */
export type Platform = 'ios' | 'android' | 'windows' | 'mac' | 'unknown';

/**
 * Installation information interface
 */
export interface InstallationInfo {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: Platform;
}

/**
 * Return type for usePWA hook
 */
export interface UsePWAReturn {
  // State
  needRefresh: boolean;
  offlineReady: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  registration: ServiceWorkerRegistration | null;

  // Actions
  updateServiceWorker: () => void;
  closeUpdateNotification: () => void;
  checkForUpdates: () => Promise<void>;
  getInstallationInfo: () => InstallationInfo;
}

/**
 * Main PWA hook that manages service worker registration and PWA state
 * @returns PWA state and control functions
 */
export function usePWA(): UsePWAReturn {
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [offlineReady, setOfflineReady] = useState<boolean>(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is installed/standalone
    checkInstallationStatus();

    // Register service worker and setup PWA features
    registerServiceWorker();

    // Setup installation detection
    setupInstallationDetection();
  }, []);

  /**
   * Check if the app is installed or running in standalone mode
   */
  function checkInstallationStatus(): void {
    // Check if running in standalone mode (installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // On mobile, also check for specific indicators
    if (isStandaloneMode) {
      setIsInstalled(true);
    }
  }

  /**
   * Register service worker and handle updates
   */
  async function registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Only register service worker in production
        // In development, the service worker file doesn't exist unless devOptions.enabled is true
        if (!import.meta.env.PROD) {
          logger.log('Service Worker: Development mode detected');
          logger.log('skipWaiting is disabled in development for stability');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        setRegistration(registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setNeedRefresh(true);
              }
            });
          }
        });

        // Handle when service worker is ready and offline functionality is available
        if (registration.active) {
          setOfflineReady(true);
        } else {
          registration.addEventListener('activate', () => {
            setOfflineReady(true);
          });
        }

        logger.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup installation detection events
   */
  function setupInstallationDetection(): void {
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      logger.log('PWA was installed');
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstalled(true);
      }
    });
  }

  /**
   * Update the service worker and refresh the app
   */
  function updateServiceWorker(): void {
    if (registration && registration.waiting) {
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page to use the new service worker
      window.location.reload();
    }
  }

  /**
   * Close the update notification without updating
   */
  function closeUpdateNotification(): void {
    setNeedRefresh(false);
  }

  /**
   * Check for service worker updates manually
   */
  async function checkForUpdates(): Promise<void> {
    if (registration) {
      try {
        await registration.update();
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  }

  /**
   * Get installation capabilities
   */
  function getInstallationInfo(): InstallationInfo {
    return {
      canInstall: 'serviceWorker' in navigator && !isInstalled,
      isInstalled,
      isStandalone,
      platform: getPlatform()
    };
  }

  /**
   * Detect the platform for installation instructions
   */
  function getPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows/.test(userAgent)) {
      return 'windows';
    } else if (/mac/.test(userAgent)) {
      return 'mac';
    } else {
      return 'unknown';
    }
  }

  return {
    // State
    needRefresh,
    offlineReady,
    isInstalled,
    isStandalone,
    registration,

    // Actions
    updateServiceWorker,
    closeUpdateNotification,
    checkForUpdates,
    getInstallationInfo
  };
}

/**
 * BeforeInstallPromptEvent interface for TypeScript
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Return type for useInstallPrompt hook
 */
export interface UseInstallPromptReturn {
  showInstallPrompt: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  dismissInstallPrompt: () => void;
}

/**
 * Hook for managing install prompt
 * @returns Install prompt state and controls
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    function handleBeforeInstallPrompt(e: Event): void {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Save the event for later use
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstallPrompt(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for installation completion
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      logger.log('PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Show the browser's install prompt
   */
  async function promptInstall(): Promise<void> {
    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      logger.log(`User response to install prompt: ${outcome}`);

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  }

  /**
   * Dismiss the install prompt
   */
  function dismissInstallPrompt(): void {
    setShowInstallPrompt(false);
    // Keep the deferredPrompt in case user wants to install later
  }

  return {
    showInstallPrompt,
    canInstall: !!deferredPrompt,
    promptInstall,
    dismissInstallPrompt
  };
}

/**
 * Return type for usePWAEvents hook
 */
export interface UsePWAEventsReturn {
  updateAvailable: boolean;
  isOfflineReady: boolean;
  clearUpdateAvailable: () => void;
}

/**
 * Hook for PWA-specific events and lifecycle
 * @returns PWA event handlers and state
 */
export function usePWAEvents(): UsePWAEventsReturn {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(false);

  useEffect(() => {
    // Listen for custom PWA events dispatched by service worker
    function handlePWAUpdate(): void {
      setUpdateAvailable(true);
    }

    function handleOfflineReady(): void {
      setIsOfflineReady(true);
    }

    window.addEventListener('pwa-update-available', handlePWAUpdate);
    window.addEventListener('pwa-offline-ready', handleOfflineReady);

    return () => {
      window.removeEventListener('pwa-update-available', handlePWAUpdate);
      window.removeEventListener('pwa-offline-ready', handleOfflineReady);
    };
  }, []);

  return {
    updateAvailable,
    isOfflineReady,
    clearUpdateAvailable: () => setUpdateAvailable(false)
  };
}
