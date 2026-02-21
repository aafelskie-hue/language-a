/**
 * Pattern extraction utilities for analyzing Guide conversations.
 * Handles: "Pattern 47 (Name)", "Pattern 47: Name", "**Pattern 47**", "Pattern 7"
 */

// Regex to match pattern references in various formats
export const PATTERN_REGEX = /\*{0,2}[Pp]atterns?\s+(\d{1,3})(?:\s*[-–:]\s*|\s*\()?([^)\n*]{0,50})?\)?(?:\*{0,2})?/g;

/**
 * Extract pattern reading_order numbers from text.
 * Returns unique pattern numbers in the range 1-254.
 */
export function extractPatternReferences(text: string): number[] {
  const patterns: number[] = [];
  const matches = Array.from(text.matchAll(PATTERN_REGEX));
  for (const match of matches) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 254) patterns.push(num);
  }
  return Array.from(new Set(patterns));
}

// Explicit gap declarations - Guide states clearly something isn't covered
export const GAP_PHRASES_EXPLICIT = [
  "doesn't yet have",
  "does not yet have",
  "no dedicated pattern",
  "no specific pattern",
  "not covered by",
  "isn't addressed",
  "Language A doesn't include",
  "outside the scope of",
  "gap in the current patterns",
  "could be a future pattern",
];

// Softer signals - Guide acknowledges adjacency without declaring flat absence
export const GAP_PHRASES_SOFT = [
  "while there isn't a specific pattern",
  "the closest patterns are",
  "no pattern directly addresses",
  "the patterns that come closest",
  "adjacent patterns include",
  "related patterns, though not exactly",
];

// Combined list of all gap phrases
export const GAP_PHRASES = [...GAP_PHRASES_EXPLICIT, ...GAP_PHRASES_SOFT];

/**
 * Detect gap signals in text. Returns an array of matched phrases.
 */
export function detectGapSignals(text: string): string[] {
  const lowerText = text.toLowerCase();
  return GAP_PHRASES.filter(phrase => lowerText.includes(phrase.toLowerCase()));
}

/**
 * Extract a topic context around a gap phrase.
 * Tries to identify what topic the gap is about from surrounding text.
 */
export function extractGapTopic(text: string, gapPhrase: string): string | null {
  const lowerText = text.toLowerCase();
  const phraseIndex = lowerText.indexOf(gapPhrase.toLowerCase());

  if (phraseIndex === -1) return null;

  // Look for context around the gap phrase (100 chars before and after)
  const start = Math.max(0, phraseIndex - 100);
  const end = Math.min(text.length, phraseIndex + gapPhrase.length + 100);
  const context = text.slice(start, end);

  // Try to extract a meaningful topic - look for quoted terms or key nouns
  // This is a simple heuristic; could be enhanced with NLP later
  const quotedMatch = context.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    return quotedMatch[1] || quotedMatch[2];
  }

  // Return the surrounding sentence as fallback
  const sentences = context.split(/[.!?]/);
  const relevantSentence = sentences.find(s =>
    s.toLowerCase().includes(gapPhrase.toLowerCase())
  );

  return relevantSentence?.trim().slice(0, 200) || null;
}
