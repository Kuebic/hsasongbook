/**
 * Zod validation schemas for song forms
 * Phase 5.3: Add Song/Arrangement Forms
 */

import { z } from 'zod';

/**
 * Song origin categories grouped by type
 */
export const SONG_ORIGIN_GROUPS = [
  {
    label: 'Community Songs',
    origins: [
      { value: 'traditional-holy-songs', label: 'Traditional Holy Songs' },
      { value: 'new-holy-songs', label: 'New Holy Songs' },
      { value: 'pioneer-songs', label: 'Pioneer Songs' },
      { value: 'original', label: 'Original' },
    ],
  },
  {
    label: 'Other Worship',
    origins: [
      { value: 'traditional-hymns', label: 'Traditional Hymns' },
      { value: 'contemporary-christian', label: 'Contemporary Christian' },
    ],
  },
  {
    label: 'Secular',
    origins: [
      { value: 'secular-songs', label: 'Secular Songs' },
    ],
  },
] as const;

// Flat list for validation and lookups
export const SONG_ORIGINS = SONG_ORIGIN_GROUPS.flatMap((g) => g.origins);

export type SongOriginValue = (typeof SONG_ORIGINS)[number]['value'];

/**
 * Helper to get origin label from value
 */
export function getOriginLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  for (const group of SONG_ORIGIN_GROUPS) {
    const found = group.origins.find((o) => o.value === value);
    if (found) return found.label;
  }
  return undefined;
}

/**
 * Add Song form schema
 */
export const addSongSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  artist: z
    .string()
    .max(200, 'Artist must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  themes: z.array(z.string()).default([]),
  lyrics: z.string().optional().or(z.literal('')),
  origin: z.string().optional().or(z.literal('')),
});

export type AddSongFormData = z.infer<typeof addSongSchema>;
