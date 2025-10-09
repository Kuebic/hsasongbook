/**
 * Metadata Injector Utility
 *
 * Injects ChordPro directives from arrangement metadata into content before parsing.
 * Implements hybrid approach: preserves embedded directives, injects missing ones.
 */

export interface ArrangementMetadata {
  key?: string;
  tempo?: number;
  timeSignature?: string;
  capo?: number;
}

export interface InjectMetadataOptions {
  strategy?: 'preserve-embedded' | 'override-all';
  fields?: Array<'key' | 'tempo' | 'time' | 'capo'>;
}

export interface ExtractedMetadata {
  key?: string;
  tempo?: number;
  timeSignature?: string;
  capo?: number;
}

/**
 * Inject metadata directives into ChordPro content
 * @param content - Original ChordPro content
 * @param arrangementMeta - Arrangement metadata object
 * @param options - Injection options
 * @returns Content with injected directives
 */
export function injectMetadata(
  content: string,
  arrangementMeta: ArrangementMetadata,
  options: InjectMetadataOptions = {}
): string {
  if (!content || !arrangementMeta) {
    return content || '';
  }

  const {
    strategy = 'preserve-embedded',
    fields = ['key', 'tempo', 'time', 'capo']
  } = options;

  // Check if directives already exist in content
  // Using multiline regex to match directives at start of lines
  const hasKey = /^\{key:/m.test(content);
  const hasTempo = /^\{tempo:/m.test(content);
  const hasTime = /^\{time:/m.test(content);
  const hasCapo = /^\{capo:/m.test(content);

  // Build directives to inject (only if missing OR override-all strategy)
  const directivesToInject: string[] = [];

  // Inject key directive
  if (fields.includes('key') && (!hasKey || strategy === 'override-all') && arrangementMeta.key) {
    directivesToInject.push(`{key: ${arrangementMeta.key}}`);
  }

  // Inject tempo directive
  if (fields.includes('tempo') && (!hasTempo || strategy === 'override-all') && arrangementMeta.tempo) {
    directivesToInject.push(`{tempo: ${arrangementMeta.tempo}}`);
  }

  // CRITICAL: Map timeSignature to {time:} directive
  if (fields.includes('time') && (!hasTime || strategy === 'override-all') && arrangementMeta.timeSignature) {
    directivesToInject.push(`{time: ${arrangementMeta.timeSignature}}`);
  }

  // Inject capo directive (even if 0, since it's explicit metadata)
  if (fields.includes('capo') && (!hasCapo || strategy === 'override-all') && arrangementMeta.capo !== undefined && arrangementMeta.capo !== null) {
    directivesToInject.push(`{capo: ${arrangementMeta.capo}}`);
  }

  // Prepend directives if any were added
  if (directivesToInject.length > 0) {
    return directivesToInject.join('\n') + '\n\n' + content;
  }

  return content;
}

/**
 * Extract metadata from ChordPro content
 * Useful for detecting existing directives
 * @param content - ChordPro content
 * @returns Extracted metadata
 */
export function extractMetadata(content: string): ExtractedMetadata {
  if (!content) {
    return {};
  }

  const metadata: ExtractedMetadata = {};

  // Extract key directive
  const keyMatch = content.match(/^\{key:\s*([^}]+)\}/m);
  if (keyMatch) {
    metadata.key = keyMatch[1].trim();
  }

  // Extract tempo directive
  const tempoMatch = content.match(/^\{tempo:\s*([^}]+)\}/m);
  if (tempoMatch) {
    metadata.tempo = parseInt(tempoMatch[1].trim(), 10);
  }

  // Extract time signature directive
  const timeMatch = content.match(/^\{time:\s*([^}]+)\}/m);
  if (timeMatch) {
    metadata.timeSignature = timeMatch[1].trim();
  }

  // Extract capo directive
  const capoMatch = content.match(/^\{capo:\s*([^}]+)\}/m);
  if (capoMatch) {
    metadata.capo = parseInt(capoMatch[1].trim(), 10);
  }

  return metadata;
}

/**
 * Check if content has any metadata directives
 * @param content - ChordPro content
 * @returns True if content has metadata directives
 */
export function hasMetadataDirectives(content: string): boolean {
  if (!content) {
    return false;
  }

  return /^\{(key|tempo|time|capo):/m.test(content);
}

/**
 * Remove metadata directives from content
 * Useful for cleanup or migration
 * @param content - ChordPro content
 * @returns Content without metadata directives
 */
export function removeMetadataDirectives(content: string): string {
  if (!content) {
    return '';
  }

  return content
    .replace(/^\{key:[^}]*\}\n?/gm, '')
    .replace(/^\{tempo:[^}]*\}\n?/gm, '')
    .replace(/^\{time:[^}]*\}\n?/gm, '')
    .replace(/^\{capo:[^}]*\}\n?/gm, '')
    .trim();
}

export default {
  injectMetadata,
  extractMetadata,
  hasMetadataDirectives,
  removeMetadataDirectives
};
