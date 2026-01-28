/**
 * Curated tag suggestions for setlists organized by category.
 * Used for autocomplete suggestions and quick-select UI.
 */

export interface SetlistTagCategory {
  id: string;
  label: string;
  tags: readonly string[];
}

export const SETLIST_TAG_CATEGORIES: readonly SetlistTagCategory[] = [
  {
    id: 'holy-days',
    label: 'Holy Days',
    tags: [
      'true-gods-day',
      'true-parents-day',
      'true-parents-birthday',
      'true-childrens-day',
      'day-of-all-things',
      'christmas',
      'easter',
    ],
  },
  {
    id: 'service-type',
    label: 'Service Type',
    tags: [
      'sunday-morning',
      'evening-service',
      'youth',
      'special-event',
      'seonghwa',
      'blessing-ceremony',
      'camp',
      'retreat',
    ],
  },
  {
    id: 'style-mood',
    label: 'Style / Mood',
    tags: [
      'contemporary',
      'traditional',
      'reflective',
      'celebratory',
      'acoustic',
      'high-energy',
      'meditative',
    ],
  },
  {
    id: 'themes',
    label: 'Themes',
    tags: [
      'praise',
      'true-love',
      'true-parents',
      'heart-of-god',
      'restoration',
      'blessing',
      'lineage',
      'dedication',
      'gratitude',
      'hope',
      'peace',
      'unity',
      'family',
      'faith',
    ],
  },
] as const;

// Flat array of all curated tags for autocomplete
export const SETLIST_TAG_SUGGESTIONS = SETLIST_TAG_CATEGORIES.flatMap(
  (cat) => cat.tags
);
