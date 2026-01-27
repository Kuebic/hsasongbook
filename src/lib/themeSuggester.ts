/**
 * Keyword-based theme suggester for worship songs.
 * Analyzes lyrics and suggests relevant themes based on keyword matching.
 */

/** Maps theme names to keywords that indicate that theme */
const THEME_KEYWORDS: Record<string, string[]> = {
  // Core Unification Themes
  'true-love': ['true love', 'eternal love', 'unchanging love', 'absolute love', 'unconditional love'],
  'true-parents': ['true parents', 'true father', 'true mother', 'rev moon', 'reverend moon', 'hak ja han', 'father moon', 'mother moon'],
  'heart-of-god': ['heart of god', 'shimjung', "god's heart", 'longing', 'suffering heart', 'divine heart', 'heavenly heart'],
  'restoration': ['restore', 'restoration', 'providence', 'providential', 'restored', 'restoring'],
  'indemnity': ['indemnity', 'condition', 'conditions', 'pay the price', 'make amends', 'restitution'],
  'blessing': ['blessing', 'blessed', 'marriage blessing', 'holy wine', 'holy blessing', 'eternal blessing'],
  'lineage': ['lineage', 'blood lineage', 'true lineage', 'ancestry', 'bloodline', 'heritage'],
  'liberation': ['liberation', 'liberate', 'set free', 'freedom', 'release', 'liberated'],
  'family': ['family', 'blessed family', 'true family', 'eternal family', 'heavenly family', 'families'],

  // Providence & Mission
  'victory': ['victory', 'victorious', 'triumph', 'overcome', 'triumphant', 'win', 'conquer'],
  'dedication': ['dedicate', 'dedication', 'commit', 'devoted', 'commitment', 'consecrate'],
  'mission': ['mission', 'calling', 'purpose', 'path', 'destiny', 'responsibility'],
  'sacrifice': ['sacrifice', 'sacrificial', 'give up', 'lay down', 'offering up', 'selfless'],
  'pioneering': ['pioneer', 'pioneering', 'frontline', 'breakthrough', 'trailblazer', 'first'],

  // Spiritual Life
  'heart': ['heart', 'shimjung', 'heartfelt', 'sincere', 'sincerity', 'genuine', 'loving heart'],
  'attendance': ['attend', 'attendance', 'serve', 'serving', 'service to', 'ministering'],
  'offering': ['offering', 'offer', 'give', '献', '献금', 'contribution', '献정'],
  'devotion': ['devotion', 'devoted', 'devote', 'faithful', 'loyalty', 'dedication'],
  'gratitude': ['grateful', 'gratitude', 'thankful', 'thanks', 'appreciate', 'thanksgiving', 'thank you'],
  'faith': ['faith', 'believe', 'trust', 'confidence', 'believing', 'faithful'],

  // Vision & Hope
  'new-age': ['new age', 'new era', 'new beginning', 'cheon il guk', 'new world', 'new heaven'],
  'fatherland': ['fatherland', 'homeland', 'original homeland', 'heavenly fatherland', 'true homeland'],
  'eden': ['eden', 'garden', 'paradise', 'original ideal', 'garden of eden', 'ideal world'],
  'peace': ['peace', 'peaceful', 'harmony', 'tranquil', 'serene', 'harmonious'],
  'hope': ['hope', 'hopeful', 'promise', 'future', 'dream', 'aspiration', 'vision'],
  'joy': ['joy', 'joyful', 'rejoice', 'glad', 'celebrate', 'happy', 'happiness', 'cheerful'],

  // Creation & Nature
  'creation': ['creation', 'nature', 'earth', 'sky', 'created', 'universe', 'cosmos', 'world'],
  'nature': ['nature', 'natural world', 'beauty', 'trees', 'mountains', 'ocean', 'flowers', 'seasons'],

  // Relationships
  'filial-piety': ['filial piety', 'filial', 'honor parents', 'respect parents', 'honoring', '孝'],
  'brotherhood': ['brother', 'sister', 'brotherhood', 'sisterhood', 'siblings', 'brothers and sisters'],
  'service': ['serve', 'service', 'serving', 'help', 'helping', 'support', 'care'],

  // Occasions
  'holy-days': ['foundation day', 'parents day', "god's day", 'true parents birthday', "children's day", 'holy day', 'celebration'],
  'blessing-ceremony': ['blessing ceremony', 'holy blessing', 'matching', 'engagement', 'marriage ceremony', 'wedding'],

  // Retained themes with updated keywords
  'unity': ['unity', 'united', 'together', 'one', 'unification', 'oneness', 'harmonious'],
  'kingdom': ['kingdom', 'cheon il guk', 'heaven on earth', 'ideal world', 'heavenly kingdom', 'kingdom of heaven'],

  // General Worship Themes
  'praise': ['praise', 'praising', 'praises', 'praised', 'sing praise', 'shout praise', 'give praise', 'offer praise'],
  'worship': ['worship', 'worshiping', 'worshipper', 'adore', 'adoration', 'adoring', 'bow down', 'exalt', 'exalting', 'magnify'],
  'prayer': ['prayer', 'praying', 'pray', 'prayers', 'intercede', 'intercession', 'petition', 'call upon', 'cry out to'],
  'guidance': ['guide', 'guidance', 'lead', 'leading', 'direct', 'direction', 'show me', 'teach me', 'instruct', 'shepherd'],

  // Additional UC-Specific Themes
  'homecoming': ['homecoming', 'return home', 'returning', 'hometown', 'going home', 'come back', 'original homeland', 'heavenly homeland'],
  'youth': ['youth', 'young', 'young people', 'next generation', 'second generation', 'children', 'blessed children', '2nd gen'],
  'cultural': ['korea', 'korean', 'hanbok', 'traditional', 'heritage', 'culture', 'cultural', '한국', 'arirang'],
  'christmas': ['christmas', 'nativity', 'bethlehem', 'manger', 'shepherds', 'wise men', 'star', 'born this day', 'silent night'],
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
