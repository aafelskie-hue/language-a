/**
 * Sorting Algorithm with Cluster Affinity
 * Sorts patterns within each scale and applies thematic clustering
 */

import { ScoredPattern } from './scorer';

/**
 * Sort patterns by context score (descending)
 * Then apply cluster affinity to keep same-category patterns adjacent
 */
export function sortWithClusterAffinity(
  scored: ScoredPattern[],
  scoreThreshold: number = 2
): ScoredPattern[] {
  // Initial sort by context score (high to low)
  const sorted = [...scored].sort((a, b) => {
    // Primary: context score descending
    if (b.contextScore !== a.contextScore) {
      return b.contextScore - a.contextScore;
    }
    // Secondary: more up references = more contextual
    if (b.upRefs !== a.upRefs) {
      return b.upRefs - a.upRefs;
    }
    // Tertiary: pattern ID for stability
    return a.pattern.id - b.pattern.id;
  });

  // Cluster affinity pass: swap adjacent patterns if they share category
  // and score difference is small
  let swapped = true;
  let passes = 0;
  const maxPasses = 10;

  while (swapped && passes < maxPasses) {
    swapped = false;
    passes++;

    for (let i = 0; i < sorted.length - 2; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const afterNext = sorted[i + 2];

      // Check if current and afterNext share category but next doesn't
      if (
        current.pattern.category === afterNext.pattern.category &&
        current.pattern.category !== next.pattern.category
      ) {
        // Only swap if scores are similar
        const scoreDiff = Math.abs(next.contextScore - afterNext.contextScore);
        if (scoreDiff <= scoreThreshold) {
          // Swap next and afterNext
          sorted[i + 1] = afterNext;
          sorted[i + 2] = next;
          swapped = true;
        }
      }
    }
  }

  return sorted;
}

/**
 * Assign sequential reading order numbers to sorted patterns
 */
export function assignReadingOrder(
  neighborhoodSorted: ScoredPattern[],
  buildingSorted: ScoredPattern[],
  constructionSorted: ScoredPattern[]
): Map<number, number> {
  const orderMap = new Map<number, number>();
  let order = 1;

  for (const sp of neighborhoodSorted) {
    orderMap.set(sp.pattern.id, order++);
  }
  for (const sp of buildingSorted) {
    orderMap.set(sp.pattern.id, order++);
  }
  for (const sp of constructionSorted) {
    orderMap.set(sp.pattern.id, order++);
  }

  return orderMap;
}
