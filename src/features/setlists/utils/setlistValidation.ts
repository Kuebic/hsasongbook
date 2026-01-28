/**
 * Setlist validation utilities
 *
 * Validates setlist form data for create/edit operations.
 */

import type { SetlistFormData, SetlistValidationErrors } from '../types';

/**
 * Validate setlist form data
 *
 * @param data - Form data to validate
 * @returns Validation errors object if invalid, null if valid
 */
export function validateSetlist(
  data: SetlistFormData
): SetlistValidationErrors | null {
  const errors: SetlistValidationErrors = {};

  // Name validation (required)
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Setlist name is required';
  }

  if (data.name && data.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  // Performance date validation (optional, but must be valid if provided)
  if (data.performanceDate) {
    const date = new Date(data.performanceDate);
    if (isNaN(date.getTime())) {
      errors.performanceDate = 'Invalid date format';
    }
  }

  // Description length validation (optional)
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
