import { z } from 'zod';

export const feedbackCategorySchema = z.enum(['bug', 'feature', 'question']);

export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  question: 'General Question',
};

export const feedbackFormSchema = z.object({
  category: feedbackCategorySchema,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  description: z
    .string()
    .min(20, 'Please provide more detail (at least 20 characters)')
    .max(5000, 'Description must be less than 5000 characters'),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
