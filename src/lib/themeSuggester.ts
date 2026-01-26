/**
 * Keyword-based theme suggester for worship songs.
 * Analyzes lyrics and suggests relevant themes based on keyword matching.
 */

/** Maps theme names to keywords that indicate that theme */
const THEME_KEYWORDS: Record<string, string[]> = {
  praise: ['praise', 'worship', 'glorify', 'exalt', 'magnify', 'adore', 'honor', 'lift up'],
  thanksgiving: ['thank', 'grateful', 'gratitude', 'bless', 'blessing'],
  forgiveness: ['forgive', 'mercy', 'pardon', 'cleanse', 'wash away'],
  grace: ['grace', 'undeserved', 'favor', 'gift'],
  hope: ['hope', 'trust', 'anchor', 'promise', 'future'],
  faith: ['faith', 'believe', 'trust', 'confidence'],
  redemption: ['redeem', 'ransom', 'rescue', 'deliver', 'set free', 'freedom'],
  sacrifice: ['cross', 'blood', 'sacrifice', 'lamb', 'died', 'calvary', 'crucified'],
  holiness: ['holy', 'sacred', 'glory', 'righteous', 'pure', 'worthy'],
  love: ['love', 'beloved', 'cherish', 'affection'],
  peace: ['peace', 'rest', 'calm', 'still', 'quiet', 'tranquil'],
  joy: ['joy', 'rejoice', 'glad', 'delight', 'celebrate', 'happy'],
  comfort: ['comfort', 'heal', 'refuge', 'shelter', 'strength', 'safe'],
  lament: ['cry', 'weep', 'sorrow', 'mourn', 'broken', 'tears', 'grief'],
  creation: ['creation', 'nature', 'earth', 'sky', 'stars', 'maker', 'mountains', 'seas'],
  advent: ['come', 'waiting', 'longing', 'prepare', 'advent'],
  resurrection: ['risen', 'alive', 'victory', 'death defeated', 'empty tomb', 'resurrection'],
  kingdom: ['kingdom', 'reign', 'throne', 'king', 'lord', 'sovereign'],
  unity: ['together', 'one', 'unity', 'community', 'family', 'church'],
  surrender: ['surrender', 'yield', 'submit', 'follow', 'obey', 'servant'],
};

/** Normalize text for matching: lowercase and remove punctuation */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ');
}

/** Check if a keyword appears in the normalized text */
function containsKeyword(normalizedText: string, keyword: string): boolean {
  // Use word boundary matching to avoid partial matches
  const pattern = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
  return pattern.test(normalizedText);
}

/**
 * Suggests themes based on lyrics content.
 * @param lyrics - The song lyrics to analyze
 * @returns Array of suggested theme names, sorted by relevance (match count)
 */
export function suggestThemes(lyrics: string): string[] {
  if (!lyrics || lyrics.trim().length === 0) {
    return [];
  }

  const normalizedLyrics = normalizeText(lyrics);
  const themeScores: Record<string, number> = {};

  // Count keyword matches for each theme
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (containsKeyword(normalizedLyrics, keyword)) {
        score++;
      }
    }
    if (score > 0) {
      themeScores[theme] = score;
    }
  }

  // Sort by score (descending) and return theme names
  return Object.entries(themeScores)
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme);
}

/** Get all available theme names (for reference/autocomplete) */
export function getAvailableThemes(): string[] {
  return Object.keys(THEME_KEYWORDS).sort();
}
