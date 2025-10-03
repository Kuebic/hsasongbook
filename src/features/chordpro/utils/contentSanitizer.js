/**
 * Content Sanitizer Utility
 *
 * Removes metadata directives from ChordPro content before saving.
 * Metadata is controlled via ArrangementMetadataForm, not embedded directives.
 */

import { removeMetadataDirectives } from './metadataInjector'

/**
 * Sanitize ChordPro content before saving to IndexedDB
 * Removes metadata directives (key, tempo, time, capo)
 * Preserves all other directives and content
 *
 * @param {string} content - Raw ChordPro content from editor
 * @returns {string} Sanitized content without metadata directives
 */
export function sanitizeChordProContent(content) {
  if (!content) {
    return ''
  }

  // Remove metadata directives
  const sanitized = removeMetadataDirectives(content)

  // Trim excessive whitespace but preserve intentional line breaks
  return sanitized.replace(/\n{3,}/g, '\n\n').trim()
}

export default {
  sanitizeChordProContent
}
