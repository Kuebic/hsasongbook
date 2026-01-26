/**
 * Audio Reference Validation Schemas
 *
 * Zod schemas for validating MP3 uploads and YouTube URLs
 */

import { z } from 'zod';

/**
 * Maximum file size for MP3 uploads (10 MB)
 */
export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for audio uploads
 */
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'] as const;

/**
 * YouTube URL validation regex patterns
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Just the VIDEO_ID (11 alphanumeric characters)
 */
const YOUTUBE_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /^[a-zA-Z0-9_-]{11}$/,
];

/**
 * Extract YouTube video ID from URL or direct ID
 * Returns null if the input is not a valid YouTube URL/ID
 */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Check for direct video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check URL patterns
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Check if a string is a valid YouTube URL or video ID
 */
export function isValidYoutubeUrl(input: string): boolean {
  return extractYoutubeVideoId(input) !== null;
}

/**
 * Zod schema for YouTube URL validation
 */
export const youtubeUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      return isValidYoutubeUrl(val);
    },
    {
      message: 'Please enter a valid YouTube URL or video ID',
    }
  );

/**
 * Validate an audio file
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type as typeof ALLOWED_AUDIO_TYPES[number])) {
    return {
      valid: false,
      error: 'Please select an MP3 file',
    };
  }

  // Check file size
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum size is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYoutubeThumbnailUrl(videoId: string): string {
  // Use mqdefault (320x180) for good quality/size balance
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Get YouTube embed URL from video ID
 */
export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
