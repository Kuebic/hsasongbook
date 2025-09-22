// Conflict resolution for offline sync operations
// Based on patterns from PRPs/ai_docs/offline-sync-patterns.md

import logger from '@/lib/logger';

/**
 * ConflictResolver handles conflicts between local and remote data
 */
export class ConflictResolver {
  constructor() {
    this.strategies = {
      'last-write-wins': this.lastWriteWinsResolver.bind(this),
      'three-way-merge': this.threeWayMergeResolver.bind(this),
      'field-specific': this.fieldSpecificResolver.bind(this),
      'user-choice': this.userChoiceResolver.bind(this)
    };
  }

  /**
   * Resolve conflict between local and remote entities
   * @param {Object} local - Local entity version
   * @param {Object} remote - Remote entity version
   * @param {Object} base - Base version (if available)
   * @param {string} strategy - Conflict resolution strategy
   * @returns {Promise<Object>} Resolved entity
   */
  async resolveConflict(local, remote, base = null, strategy = 'last-write-wins') {
    const resolver = this.strategies[strategy];
    if (!resolver) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    logger.log(`Resolving conflict for ${local.id} using ${strategy} strategy`);
    return await resolver(local, remote, base);
  }

  /**
   * Last-Write-Wins conflict resolution strategy
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @returns {Promise<Object>} Winning entity
   */
  async lastWriteWinsResolver(local, remote) {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    if (localTime > remoteTime) {
      logger.log('Local version wins (newer timestamp)');
      return { ...local, syncStatus: 'synced' };
    } else if (remoteTime > localTime) {
      logger.log('Remote version wins (newer timestamp)');
      return { ...remote, syncStatus: 'synced' };
    } else {
      // Same timestamp - use deterministic tiebreaker
      const tiebreaker = local.updatedBy > remote.updatedBy ? local : remote;
      logger.log('Timestamp tie - using deterministic tiebreaker');
      return { ...tiebreaker, syncStatus: 'synced' };
    }
  }

  /**
   * Three-way merge conflict resolution strategy
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @param {Object} base - Base entity (common ancestor)
   * @returns {Promise<Object>} Merged entity
   */
  async threeWayMergeResolver(local, remote, base) {
    if (!base) {
      logger.warn('No base version available, falling back to last-write-wins');
      return this.lastWriteWinsResolver(local, remote);
    }

    const merged = {
      id: local.id,
      version: Math.max(local.version || 0, remote.version || 0) + 1,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };

    // Get all fields from all versions
    const allFields = new Set([
      ...Object.keys(local),
      ...Object.keys(remote),
      ...Object.keys(base)
    ]);

    for (const field of allFields) {
      if (['id', 'version', 'updatedAt', 'syncStatus'].includes(field)) {
        continue; // Skip metadata fields
      }

      const localValue = local[field];
      const remoteValue = remote[field];
      const baseValue = base[field];

      merged[field] = await this.mergeField(field, localValue, remoteValue, baseValue);
    }

    logger.log('Three-way merge completed');
    return merged;
  }

  /**
   * Merge individual field values
   * @param {string} field - Field name
   * @param {any} localValue - Local field value
   * @param {any} remoteValue - Remote field value
   * @param {any} baseValue - Base field value
   * @returns {Promise<any>} Merged field value
   */
  async mergeField(field, localValue, remoteValue, baseValue) {
    // If values are the same, no conflict
    if (this.deepEqual(localValue, remoteValue)) {
      return localValue;
    }

    // If local value hasn't changed from base, use remote
    if (this.deepEqual(localValue, baseValue)) {
      return remoteValue;
    }

    // If remote value hasn't changed from base, use local
    if (this.deepEqual(remoteValue, baseValue)) {
      return localValue;
    }

    // Both changed - need field-specific resolution
    return this.resolveFieldConflict(field, localValue, remoteValue, baseValue);
  }

  /**
   * Field-specific conflict resolution
   * @param {string} field - Field name
   * @param {any} localValue - Local field value
   * @param {any} remoteValue - Remote field value
   * @param {any} baseValue - Base field value
   * @returns {Promise<any>} Resolved field value
   */
  async resolveFieldConflict(field, localValue, remoteValue) {
    switch (field) {
      case 'title':
      case 'name':
      case 'description':
        // For text fields: prefer longer value (more information)
        return localValue && remoteValue
          ? (localValue.length > remoteValue.length ? localValue : remoteValue)
          : (localValue || remoteValue);

      case 'tags':
      case 'themes':
        // For arrays: merge unique values
        if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
          return [...new Set([...localValue, ...remoteValue])].sort();
        }
        return localValue || remoteValue || [];

      case 'rating':
      case 'tempo':
        // For numbers: average
        if (typeof localValue === 'number' && typeof remoteValue === 'number') {
          return Math.round((localValue + remoteValue) / 2 * 10) / 10; // Round to 1 decimal
        }
        return localValue !== null && localValue !== undefined ? localValue : remoteValue;

      case 'favorites':
        // For popularity metrics: use maximum
        return Math.max(localValue || 0, remoteValue || 0);

      case 'chordProContent':
      case 'chordData':
        // For chord data: prefer local version (user is actively editing)
        return localValue || remoteValue;

      case 'lyrics':
        // For lyrics object: merge language versions
        if (typeof localValue === 'object' && typeof remoteValue === 'object') {
          return { ...remoteValue, ...localValue }; // Local takes precedence
        }
        return localValue || remoteValue;

      case 'songs':
        // For setlist songs array: merge by order and unique songId
        if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
          return this.mergeSetlistSongs(localValue, remoteValue);
        }
        return localValue || remoteValue || [];

      default:
        // Default: prefer local value (user is actively working on it)
        logger.log(`Using default resolution for field '${field}': preferring local value`);
        return localValue !== null && localValue !== undefined ? localValue : remoteValue;
    }
  }

  /**
   * Merge setlist songs arrays
   * @param {Array} localSongs - Local songs array
   * @param {Array} remoteSongs - Remote songs array
   * @returns {Array} Merged songs array
   */
  mergeSetlistSongs(localSongs, remoteSongs) {
    const songMap = new Map();

    // Add remote songs first
    remoteSongs.forEach(song => {
      songMap.set(song.songId, song);
    });

    // Add/override with local songs
    localSongs.forEach(song => {
      const existing = songMap.get(song.songId);
      if (existing) {
        // Prefer local version but keep higher order if remote order is higher
        songMap.set(song.songId, {
          ...existing,
          ...song,
          order: Math.max(existing.order || 0, song.order || 0)
        });
      } else {
        songMap.set(song.songId, song);
      }
    });

    // Convert back to array and sort by order
    return Array.from(songMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Field-specific conflict resolution strategy
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @returns {Promise<Object>} Resolved entity
   */
  async fieldSpecificResolver(local, remote) {
    const resolved = {
      ...remote, // Start with remote as base
      id: local.id,
      version: Math.max(local.version || 0, remote.version || 0) + 1,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced'
    };

    // Apply field-specific resolution rules
    for (const field of Object.keys(local)) {
      if (['id', 'version', 'updatedAt', 'syncStatus'].includes(field)) {
        continue;
      }

      resolved[field] = await this.resolveFieldConflict(
        field,
        local[field],
        remote[field],
        null // No base version available
      );
    }

    logger.log('Field-specific resolution completed');
    return resolved;
  }

  /**
   * User choice conflict resolution strategy
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @returns {Promise<Object>} User-chosen entity
   */
  async userChoiceResolver(local, remote) {
    // This would typically show a UI for user selection
    // For now, we'll simulate with a preference or fallback to last-write-wins
    logger.log('User choice resolution - presenting conflict to user');

    // Store conflict for user resolution
    await this.storeConflictForUserResolution(local, remote);

    // For now, fallback to last-write-wins
    return this.lastWriteWinsResolver(local, remote);
  }

  /**
   * Store conflict for later user resolution
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @returns {Promise<void>}
   */
  async storeConflictForUserResolution(local, remote) {
    // This would store the conflict in a special store for user review
    // Implementation depends on how conflicts are presented to users
    logger.log(`Storing conflict for user resolution: ${local.id}`);

    // Could dispatch custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-conflict', {
        detail: { local, remote, entityId: local.id }
      }));
    }
  }

  /**
   * Detect if entities have conflicts
   * @param {Object} local - Local entity
   * @param {Object} remote - Remote entity
   * @returns {boolean} True if entities conflict
   */
  hasConflict(local, remote) {
    if (!local || !remote) {
      return false;
    }

    // Check if versions differ significantly
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    // If timestamps are very close (within 1 second), probably no real conflict
    if (Math.abs(localTime - remoteTime) < 1000) {
      return false;
    }

    // Check if content actually differs
    const localContent = this.getContentHash(local);
    const remoteContent = this.getContentHash(remote);

    return localContent !== remoteContent;
  }

  /**
   * Get content hash for comparison
   * @param {Object} entity - Entity to hash
   * @returns {string} Content hash
   */
  getContentHash(entity) {
    // Create a hash of significant content fields (excluding metadata)
    const contentFields = { ...entity };
    delete contentFields.id;
    delete contentFields.version;
    delete contentFields.updatedAt;
    delete contentFields.createdAt;
    delete contentFields.syncStatus;

    return JSON.stringify(contentFields);
  }

  /**
   * Deep equality check for values
   * @param {any} a - First value
   * @param {any} b - Second value
   * @returns {boolean} True if values are deeply equal
   */
  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((val, index) => this.deepEqual(val, b[index]));
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Get conflict resolution strategy for entity type
   * @param {string} entityType - Type of entity (songs, arrangements, setlists)
   * @returns {string} Recommended strategy
   */
  getRecommendedStrategy(entityType) {
    const strategies = {
      songs: 'field-specific', // Songs benefit from field-specific merging
      arrangements: 'last-write-wins', // Arrangements are usually edited by one person
      setlists: 'three-way-merge' // Setlists can be collaboratively edited
    };

    return strategies[entityType] || 'last-write-wins';
  }

  /**
   * Resolve multiple conflicts in batch
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Promise<Array>} Array of resolved entities
   */
  async resolveConflicts(conflicts) {
    const resolved = [];

    for (const conflict of conflicts) {
      try {
        const strategy = this.getRecommendedStrategy(conflict.type);
        const resolution = await this.resolveConflict(
          conflict.local,
          conflict.remote,
          conflict.base,
          strategy
        );
        resolved.push(resolution);
      } catch (error) {
        console.error(`Failed to resolve conflict for ${conflict.local?.id}:`, error);
        // Fallback to local version
        resolved.push({ ...conflict.local, syncStatus: 'conflict' });
      }
    }

    return resolved;
  }
}