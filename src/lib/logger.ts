/**
 * Environment-aware logger utility
 * Only logs in development mode, suppresses logs in production
 * Always shows errors regardless of environment
 */

const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  table: (data: unknown) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

const logger: Logger = {
  /**
   * Log general information (only in development)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always shown)
   * Errors should always be visible for debugging production issues
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log debug information (only in development)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Create a table log (only in development)
   */
  table: (data: unknown): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Start a timer (only in development)
   */
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * End a timer (only in development)
   */
  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  /**
   * Group logs (only in development)
   */
  group: (label: string): void => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * End log group (only in development)
   */
  groupEnd: (): void => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export type { Logger };
export default logger;
