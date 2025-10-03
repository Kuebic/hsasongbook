/**
 * useArrangementData Hook
 *
 * Replace mock dataHelpers with IndexedDB repository access
 * Maintains same interface for compatibility with existing components
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrangementRepository, SongRepository } from '../../pwa/db/repository.js'
import { persistenceService } from '../../chordpro/services/PersistenceService.js'
import logger from '@/lib/logger'

/**
 * useArrangementData Hook
 * Provides access to arrangement and song data from IndexedDB
 *
 * @param {string} arrangementId - Arrangement ID to load
 * @returns {Object} Arrangement data, loading state, and operations
 */
export function useArrangementData(arrangementId) {
  const [arrangement, setArrangement] = useState(null)
  const [song, setSong] = useState(null)
  const [allArrangements, setAllArrangements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Repository instances (useMemo to avoid recreation)
  const arrangementRepo = useMemo(() => new ArrangementRepository(), [])
  const songRepo = useMemo(() => new SongRepository(), [])

  /**
   * Load arrangement and related data
   */
  const loadArrangement = useCallback(async () => {
    if (!arrangementId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.debug('Loading arrangement from IndexedDB:', arrangementId)

      // Load arrangement
      const arrangementData = await arrangementRepo.getById(arrangementId)

      if (!arrangementData) {
        setError('Arrangement not found')
        setArrangement(null)
        setSong(null)
        setAllArrangements([])
        setLoading(false)
        return
      }

      // Load parent song
      const songData = await songRepo.getById(arrangementData.songId)

      if (!songData) {
        setError('Parent song not found')
        setArrangement(arrangementData)
        setSong(null)
        setAllArrangements([])
        setLoading(false)
        return
      }

      // Load all arrangements for this song
      const siblingArrangements = await arrangementRepo.getBySong(arrangementData.songId)

      setArrangement(arrangementData)
      setSong(songData)
      setAllArrangements(siblingArrangements)
      setError(null)

      logger.debug('Arrangement data loaded successfully:', {
        arrangementId: arrangementData.id,
        songId: songData.id,
        totalArrangements: siblingArrangements.length
      })
    } catch (err) {
      logger.error('Failed to load arrangement:', err)
      setError('Failed to load arrangement')
      setArrangement(null)
      setSong(null)
      setAllArrangements([])
    } finally {
      setLoading(false)
    }
  }, [arrangementId, arrangementRepo, songRepo])

  /**
   * Update arrangement content
   * Uses PersistenceService for proper save flow
   */
  const updateArrangement = useCallback(async (updatedData) => {
    if (!arrangement) {
      return {
        success: false,
        error: new Error('No arrangement loaded')
      }
    }

    try {
      logger.debug('Updating arrangement:', arrangement.id)

      // If updating chordProContent, use PersistenceService
      if (updatedData.chordProContent !== undefined) {
        const result = await persistenceService.saveToArrangement(
          arrangement.id,
          updatedData.chordProContent,
          arrangement.version
        )

        if (result.success) {
          // Update local state with saved arrangement
          setArrangement(result.arrangement)
          logger.debug('Arrangement updated successfully via PersistenceService')
        }

        return result
      }

      // For other fields, use repository directly
      const updatedArrangement = {
        ...arrangement,
        ...updatedData
      }

      const saved = await arrangementRepo.save(updatedArrangement)
      setArrangement(saved)

      logger.debug('Arrangement metadata updated successfully')

      return {
        success: true,
        arrangement: saved,
        timestamp: new Date()
      }
    } catch (error) {
      logger.error('Failed to update arrangement:', error)
      return {
        success: false,
        error,
        timestamp: new Date()
      }
    }
  }, [arrangement, arrangementRepo])

  /**
   * Reload arrangement data (useful after save)
   */
  const reload = useCallback(() => {
    loadArrangement()
  }, [loadArrangement])

  // Load data on mount and when arrangementId changes
  useEffect(() => {
    loadArrangement()
  }, [loadArrangement])

  return {
    // Data
    arrangement,
    song,
    allArrangements,

    // State
    loading,
    error,

    // Operations
    updateArrangement,
    reload,

    // Compatibility with dataHelpers interface
    getArrangementById: useCallback(() => arrangement, [arrangement]),
    getSongById: useCallback(() => song, [song]),
    getArrangementsBySongId: useCallback(() => allArrangements, [allArrangements])
  }
}

/**
 * Default export for convenient importing
 */
export default useArrangementData
