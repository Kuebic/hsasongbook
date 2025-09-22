/**
 * Environment-aware logger utility
 * Only logs in development mode, suppresses logs in production
 * Always shows errors regardless of environment
 */

const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

const logger = {
  /**
   * Log general information (only in development)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always shown)
   * Errors should always be visible for debugging production issues
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log debug information (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Create a table log (only in development)
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Start a timer (only in development)
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * End a timer (only in development)
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  /**
   * Group logs (only in development)
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * End log group (only in development)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export default logger;