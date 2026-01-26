/**
 * useArrangementAudio Hook
 *
 * Provides access to arrangement audio data and upload/remove capabilities.
 * Handles MP3 uploads to R2 and YouTube URL management.
 */

import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUploadFile } from '@convex-dev/r2/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { validateAudioFile } from '../validation/audioSchemas';

interface UseArrangementAudioReturn {
  // Audio URL (signed, 24h expiry)
  audioUrl: string | null;
  // Loading state
  loading: boolean;
  // Upload an MP3 file
  uploadAudio: (file: File) => Promise<{ success: boolean; error?: string }>;
  // Remove the audio file
  removeAudio: () => Promise<{ success: boolean; error?: string }>;
  // Validate file before upload
  validateFile: (file: File) => { valid: boolean; error?: string };
}

/**
 * Hook for managing arrangement audio files
 *
 * @param arrangementId - The arrangement ID to manage audio for
 * @returns Audio URL, loading state, and upload/remove functions
 */
export function useArrangementAudio(
  arrangementId: string | null
): UseArrangementAudioReturn {
  // Query for signed audio URL
  const audioUrl = useQuery(
    api.files.getArrangementAudioUrl,
    arrangementId ? { arrangementId: arrangementId as Id<'arrangements'> } : 'skip'
  );

  // Mutations
  const saveAudioMutation = useMutation(api.files.saveArrangementAudio);
  const removeAudioMutation = useMutation(api.files.removeArrangementAudio);

  // R2 upload hook
  const uploadFile = useUploadFile(api.files);

  /**
   * Validate file before upload (wraps shared validation for hook interface)
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    return validateAudioFile(file);
  }, []);

  /**
   * Upload an MP3 file to the arrangement
   */
  const uploadAudio = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      if (!arrangementId) {
        return { success: false, error: 'No arrangement selected' };
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      try {
        // Upload to R2
        const key = await uploadFile(file);

        // Save key to arrangement (also deletes old file if replacing)
        await saveAudioMutation({
          arrangementId: arrangementId as Id<'arrangements'>,
          key,
        });

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload audio';
        return { success: false, error: message };
      }
    },
    [arrangementId, uploadFile, saveAudioMutation, validateFile]
  );

  /**
   * Remove audio from the arrangement
   */
  const removeAudio = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!arrangementId) {
      return { success: false, error: 'No arrangement selected' };
    }

    try {
      await removeAudioMutation({
        arrangementId: arrangementId as Id<'arrangements'>,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove audio';
      return { success: false, error: message };
    }
  }, [arrangementId, removeAudioMutation]);

  return {
    audioUrl: audioUrl ?? null,
    loading: audioUrl === undefined,
    uploadAudio,
    removeAudio,
    validateFile,
  };
}

export default useArrangementAudio;
