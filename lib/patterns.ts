import patternsData from '@/data/patterns.json';
import categoriesData from '@/data/categories.json';
import type { Pattern, Category, Scale, Confidence } from './types';

// All patterns including unpublished (255+) for direct lookups
const allPatterns: Pattern[] = (patternsData as Pattern[]).slice().sort(
  (a, b) => a.id - b.id
);

// Published patterns (1-254) for listings and explorer
export const patterns: Pattern[] = allPatterns.filter(p => p.id <= 254);
export const categories: Category[] = categoriesData as Category[];

export function getPatternById(id: number): Pattern | undefined {
  return allPatterns.find(p => p.id === id);
}

export function getPatternByReadingOrder(readingOrder: number): Pattern | undefined {
  return patterns.find(p => p.reading_order === readingOrder);
}

export function getPatternByNumber(num: string): Pattern | undefined {
  return patterns.find(p => p.number === num || p.id === parseInt(num, 10));
}

export function getPatternsByCategory(categoryId: string): Pattern[] {
  return patterns.filter(p => p.category === categoryId).sort(
    (a, b) => a.reading_order - b.reading_order
  );
}

export function getPatternsByScale(scale: Scale): Pattern[] {
  return patterns.filter(p => p.scale === scale).sort(
    (a, b) => a.reading_order - b.reading_order
  );
}

export function getPatternsByConfidence(confidence: Confidence): Pattern[] {
  return patterns.filter(p => p.confidence === confidence);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getCategoryForPattern(pattern: Pattern): Category | undefined {
  return getCategoryById(pattern.category);
}

export function getConnectedPatterns(pattern: Pattern): {
  up: Pattern[];
  down: Pattern[];
} {
  return {
    up: pattern.connections_up.map(id => getPatternById(id)).filter(Boolean) as Pattern[],
    down: pattern.connections_down.map(id => getPatternById(id)).filter(Boolean) as Pattern[],
  };
}

export function getCategorySiblings(pattern: Pattern): Pattern[] {
  return patterns.filter(p => p.category === pattern.category && p.id !== pattern.id);
}

export function getNextPattern(id: number): Pattern | undefined {
  const currentIndex = patterns.findIndex(p => p.id === id);
  if (currentIndex === -1 || currentIndex === patterns.length - 1) return undefined;
  return patterns[currentIndex + 1];
}

export function getPreviousPattern(id: number): Pattern | undefined {
  const currentIndex = patterns.findIndex(p => p.id === id);
  if (currentIndex <= 0) return undefined;
  return patterns[currentIndex - 1];
}

export function getRandomPattern(): Pattern {
  return patterns[Math.floor(Math.random() * patterns.length)];
}

export function searchPatterns(query: string): Pattern[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return patterns;

  return patterns.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.problem.toLowerCase().includes(lowerQuery) ||
    p.solution.toLowerCase().includes(lowerQuery) ||
    p.reading_order.toString().includes(lowerQuery) ||
    p.categoryLabel.toLowerCase().includes(lowerQuery)
  );
}

export function filterPatterns(options: {
  scale?: Scale | null;
  category?: string | null;
  confidence?: Confidence | null;
  search?: string;
}): Pattern[] {
  let result = [...patterns];

  if (options.scale) {
    result = result.filter(p => p.scale === options.scale);
  }

  if (options.category) {
    result = result.filter(p => p.category === options.category);
  }

  if (options.confidence !== undefined && options.confidence !== null) {
    result = result.filter(p => p.confidence === options.confidence);
  }

  if (options.search) {
    const query = options.search.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.problem.toLowerCase().includes(query) ||
      p.solution.toLowerCase().includes(query) ||
      p.reading_order.toString().includes(query)
    );
  }

  return result;
}

export function getScaleLabel(scale: Scale): string {
  const labels: Record<Scale, string> = {
    neighborhood: 'Neighborhood',
    building: 'Building',
    construction: 'Construction',
  };
  return labels[scale];
}

export function getConfidenceStars(confidence: Confidence): string {
  if (confidence === 2) return '★★';
  if (confidence === 1) return '★';
  return '☆';
}

export function getConfidenceLabel(confidence: Confidence): string {
  const labels: Record<Confidence, string> = {
    2: 'High Confidence',
    1: 'Moderate Confidence',
    0: 'Speculative',
  };
  return labels[confidence];
}

// Get suggested patterns based on connections
export function getSuggestedPatterns(patternIds: number[]): Pattern[] {
  const connected = new Set<number>();

  for (const id of patternIds) {
    const pattern = getPatternById(id);
    if (pattern) {
      pattern.connections_up.forEach(c => connected.add(c));
      pattern.connections_down.forEach(c => connected.add(c));
    }
  }

  // Remove patterns already in the list
  patternIds.forEach(id => connected.delete(id));

  return Array.from(connected)
    .map(id => getPatternById(id))
    .filter(Boolean) as Pattern[];
}
