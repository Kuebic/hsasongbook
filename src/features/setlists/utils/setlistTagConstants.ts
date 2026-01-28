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
    id: 'liturgical',
    label: 'Liturgical Season',
    tags: [
      'advent',
      'christmas',
      'lent',
      'easter',
      'pentecost',
      'ordinary-time',
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
      'funeral',
      'wedding',
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
      'communion',
      'healing',
      'missions',
      'thanksgiving',
      'dedication',
      'family',
      'faith',
    ],
  },
] as const;

// Flat array of all curated tags for autocomplete
export const SETLIST_TAG_SUGGESTIONS = SETLIST_TAG_CATEGORIES.flatMap(
  (cat) => cat.tags
);
