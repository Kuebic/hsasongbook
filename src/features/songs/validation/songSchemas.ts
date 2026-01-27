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

/**
 * Quote source options for Rev. Moon quotes
 */
export const QUOTE_SOURCES = [
  { value: 'csg', label: 'Cheon Seong Gyeong' },
  { value: 'divine-principle', label: 'Divine Principle' },
  { value: 'true-parents', label: 'True Parents Speeches' },
  { value: 'other', label: 'Other' },
] as const;

export type QuoteSourceValue = (typeof QUOTE_SOURCES)[number]['value'];

/**
 * Helper to get reference placeholder based on quote source
 */
export function getReferencePlaceholder(source: string): string {
  switch (source) {
    case 'csg':
      return 'e.g., 2.1.3';
    case 'divine-principle':
      return 'e.g., Chapter 1, Section 2';
    case 'true-parents':
      return 'e.g., Speech Title, Date';
    default:
      return 'Enter reference...';
  }
}

/**
 * Bible verse validation schema
 */
export const bibleVerseSchema = z.object({
  reference: z
    .string()
    .min(1, 'Reference is required')
    .max(100, 'Reference must be less than 100 characters'),
  text: z
    .string()
    .min(1, 'Verse text is required')
    .max(2000, 'Verse text must be less than 2000 characters'),
  version: z
    .string()
    .max(50, 'Version must be less than 50 characters')
    .optional()
    .or(z.literal('')),
});

export type BibleVerseFormData = z.infer<typeof bibleVerseSchema>;

/**
 * Quote validation schema
 */
export const quoteSchema = z.object({
  text: z
    .string()
    .min(1, 'Quote text is required')
    .max(2000, 'Quote text must be less than 2000 characters'),
  source: z.string().min(1, 'Source is required'),
  reference: z
    .string()
    .min(1, 'Reference is required')
    .max(200, 'Reference must be less than 200 characters'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

/**
 * Edit Song form schema (includes spiritual context)
 */
export const editSongSchema = addSongSchema.extend({
  copyright: z
    .string()
    .max(500, 'Copyright must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  // Spiritual context fields
  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  bibleVerses: z.array(bibleVerseSchema).optional(),
  quotes: z.array(quoteSchema).optional(),
});

export type EditSongFormData = z.infer<typeof editSongSchema>;
