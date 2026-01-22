/**
 * Zod validation schemas for song forms
 * Phase 5.3: Add Song/Arrangement Forms
 */

import { z } from 'zod';

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
});

export type AddSongFormData = z.infer<typeof addSongSchema>;
