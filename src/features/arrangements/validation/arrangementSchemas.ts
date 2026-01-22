/**
 * Zod validation schemas for arrangement forms
 * Phase 5.3: Add Song/Arrangement Forms
 */

import { z } from 'zod';

/**
 * Add Arrangement form schema
 *
 * Note: Only captures initial metadata. Tempo, timeSignature, and chordProContent
 * are edited in the arrangement editor page after creation.
 */
export const addArrangementSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  key: z.string().optional().or(z.literal('')),
  capo: z.number().min(0).max(12).optional(),
  tags: z.array(z.string()).default([]),
});

export type AddArrangementFormData = z.infer<typeof addArrangementSchema>;
