/**
 * Environment-specific configuration overrides
 * Allows customization of configuration values based on the current environment
 */

import { config as baseConfig } from './index.js';

// Deep merge utility for configuration objects
function mergeDeep(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Environment-specific configuration overrides
const envOverrides = {
  development: {
    sync: {
      simulationFailureRate: 0.2, // Higher failure rate for testing
      baseDelay: 500, // Faster retries in dev
      maxDelay: 10000 // Shorter max delay in dev
    },
    pwa: {
      networkTimeoutSeconds: 10 // Longer timeout for debugging
    },
    cache: {
      maxAge: {
        dynamic: 60 * 60 * 1000, // 1 hour in dev for faster updates
        api: 5 * 60 * 1000 // 5 minutes in dev
      }
    }
  },
  production: {
    sync: {
      simulationFailureRate: 0, // No simulated failures in production
      maxRetries: 5, // More retries in production
      baseDelay: 2000, // More conservative retry timing
      maxDelay: 60000 // Longer max delay in production
    },
    cache: {
      storage: {
        warningThreshold: 0.7, // Earlier warning in production
        criticalThreshold: 0.9 // More conservative critical threshold
      }
    }
  },
  test: {
    database: {
      name: 'HSASongbookDB_Test',
      reconnectionDelay: 100,
      version: 1
    },
    sync: {
      baseDelay: 10,
      maxDelay: 100,
      cleanupAgeHours: 1,
      simulationFailureRate: 0.5 // High failure rate for testing
    },
    cache: {
      maxAge: {
        dynamic: 1000, // 1 second for tests
        api: 1000 // 1 second for tests
      }
    },
    pwa: {
      networkTimeoutSeconds: 1 // Quick timeout for tests
    }
  }
};

// Get configuration for the current environment
export const getConfig = (env = 'development') => {
  // Handle NODE_ENV for backward compatibility
  const environment = env === 'production' || env === 'development' || env === 'test'
    ? env
    : 'development';

  const override = envOverrides[environment] || {};
  const finalConfig = mergeDeep(baseConfig, override);

  return finalConfig;
};

// Get current environment (for runtime use only, not build time)
export const getCurrentEnvironment = () => {
  // This will only work at runtime, not during build
  try {
    return import.meta.env.MODE || 'development';
  } catch {
    return 'development';
  }
};

// Check if in development mode
export const isDevelopment = () => {
  return getCurrentEnvironment() === 'development';
};

// Check if in production mode
export const isProduction = () => {
  return getCurrentEnvironment() === 'production';
};

// Check if in test mode
export const isTest = () => {
  return getCurrentEnvironment() === 'test';
};

// Export default config getter
export default getConfig;