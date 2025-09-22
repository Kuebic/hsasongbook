// Main PWA hook for service worker management and PWA state
import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

/**
 * Main PWA hook that manages service worker registration and PWA state
 * @returns {Object} PWA state and control functions
 */
export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
  function checkInstallationStatus() {
    // Check if running in standalone mode (installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    // On mobile, also check for specific indicators
    if (isStandaloneMode) {
      setIsInstalled(true);
    }
  }

  /**
   * Register service worker and handle updates
   */
  async function registerServiceWorker() {
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
  function setupInstallationDetection() {
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
  function updateServiceWorker() {
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
  function closeUpdateNotification() {
    setNeedRefresh(false);
  }

  /**
   * Check for service worker updates manually
   */
  async function checkForUpdates() {
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
  function getInstallationInfo() {
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
  function getPlatform() {
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
 * Hook for managing install prompt
 * @returns {Object} Install prompt state and controls
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    function handleBeforeInstallPrompt(e) {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Save the event for later use
      setDeferredPrompt(e);
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
  async function promptInstall() {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

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
  function dismissInstallPrompt() {
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
 * Hook for PWA-specific events and lifecycle
 * @returns {Object} PWA event handlers and state
 */
export function usePWAEvents() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Listen for custom PWA events dispatched by service worker
    function handlePWAUpdate() {
      setUpdateAvailable(true);
    }

    function handleOfflineReady() {
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