/**
 * Supabase Client Setup for HSA Songbook
 *
 * Features:
 * - IndexedDB storage adapter for PWA session persistence
 * - Anonymous sign-in support for offline-first experience
 * - Automatic token refresh with offline fallback
 * - Type-safe configuration
 *
 * Phase 5: Authentication Flow
 */

import { createClient } from '@supabase/supabase-js';
import { getDatabase } from '@/features/pwa/db/database';
import logger from '@/lib/logger';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env'
  );
}

/**
 * IndexedDB Storage Adapter for Supabase Auth
 *
 * Uses HSA Songbook's existing IndexedDB instance for session storage.
 * This ensures session persistence works correctly in PWA context,
 * where localStorage may not be available in service workers.
 *
 * Pattern from: https://supabase.com/docs/guides/auth/sessions#custom-storage
 */
const indexedDBStorageAdapter = {
  /**
   * Retrieve session from IndexedDB
   */
  async getItem(_key: string): Promise<string | null> {
    try {
      const db = await getDatabase();

      // Get current session from IndexedDB
      const session = await db.get('sessions', 'current');

      if (!session) {
        return null;
      }

      // Supabase expects session data as JSON string
      return JSON.stringify(session);
    } catch (error) {
      logger.error('Failed to get auth session from IndexedDB:', error);
      return null;
    }
  },

  /**
   * Store session in IndexedDB
   */
  async setItem(_key: string, value: string): Promise<void> {
    try {
      const db = await getDatabase();

      // Parse session data from JSON string
      const sessionData = JSON.parse(value);

      // Store in IndexedDB with 'current' key
      await db.put('sessions', sessionData, 'current');

      logger.debug('Auth session stored in IndexedDB');
    } catch (error) {
      logger.error('Failed to store auth session in IndexedDB:', error);
      // Don't throw - session will work in memory, just won't persist
    }
  },

  /**
   * Remove session from IndexedDB
   */
  async removeItem(_key: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete('sessions', 'current');
      logger.debug('Auth session removed from IndexedDB');
    } catch (error) {
      logger.error('Failed to remove auth session from IndexedDB:', error);
    }
  },
};

/**
 * Supabase Client Instance
 *
 * Configuration:
 * - Custom IndexedDB storage adapter (PWA-compatible)
 * - Auto-refresh tokens (default: 1 hour before expiry)
 * - Persist session across app restarts
 * - Disable OAuth redirect detection (not using OAuth in Phase 5.0)
 *
 * Anonymous Auth:
 * - Users start as anonymous (full offline access)
 * - Can convert to authenticated later (user ID preserved)
 * - Configured in Supabase dashboard (Project Settings → Auth → User Signups)
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: indexedDBStorageAdapter,
    autoRefreshToken: true, // Auto-refresh tokens before expiry
    persistSession: true,   // Persist session in storage
    detectSessionInUrl: false, // Disable for PWA (no OAuth redirects in Phase 5.0)
  },
});

/**
 * Get current auth user (convenience wrapper)
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    logger.error('Failed to get current user:', error);
    return null;
  }

  return user;
}

/**
 * Get current session (convenience wrapper)
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    logger.error('Failed to get current session:', error);
    return null;
  }

  return session;
}

export default supabase;
