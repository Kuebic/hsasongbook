/**
 * Type definitions for spiritual context (notes, Bible verses, quotes)
 */

export interface BibleVerse {
  reference: string;
  text: string;
  version?: string;
}

export interface Quote {
  text: string;
  source: string;
  reference: string;
}

export interface SpiritualContext {
  notes?: string;
  bibleVerses?: BibleVerse[];
  quotes?: Quote[];
}
