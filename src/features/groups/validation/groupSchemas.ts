/**
 * Group Validation Schemas
 * Phase 2: Groups - Zod schemas for group forms
 */

import { z } from 'zod';

/**
 * Schema for creating a new group
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be at most 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  joinPolicy: z.enum(['open', 'approval'], {
    required_error: 'Please select a join policy',
  }),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

/**
 * Schema for updating a group
 */
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be at most 50 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  joinPolicy: z.enum(['open', 'approval']).optional(),
});

export type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;
