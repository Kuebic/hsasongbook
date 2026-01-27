import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/logger';

interface AnonymousFavorite {
  targetId: string;
  targetType: 'song' | 'arrangement' | 'setlist';
  timestamp: number;
}

const STORAGE_KEY = 'hsasongbook-anonymous-favorites';

/**
 * Hook for managing anonymous user favorites via localStorage.
 * Used when user is not authenticated - favorites persist locally only.
 */
export function useAnonymousFavorites() {
  const [favorites, setFavorites] = useState<AnonymousFavorite[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      logger.warn('Failed to load anonymous favorites from localStorage (private browsing?)', e);
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      logger.warn('Failed to save anonymous favorites to localStorage (private browsing?)', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((
    targetId: string,
    targetType: 'song' | 'arrangement' | 'setlist'
  ) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => f.targetId === targetId && f.targetType === targetType
      );

      if (exists) {
        return prev.filter(
          (f) => !(f.targetId === targetId && f.targetType === targetType)
        );
      } else {
        return [...prev, { targetId, targetType, timestamp: Date.now() }];
      }
    });
  }, []);

  const isFavorited = useCallback((
    targetId: string,
    targetType: 'song' | 'arrangement' | 'setlist'
  ): boolean => {
    return favorites.some(
      (f) => f.targetId === targetId && f.targetType === targetType
    );
  }, [favorites]);

  const getFavoritesByType = useCallback((targetType: 'song' | 'arrangement' | 'setlist') => {
    return favorites.filter((f) => f.targetType === targetType);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorited,
    getFavoritesByType,
  };
}
