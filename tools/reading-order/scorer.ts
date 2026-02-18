/**
 * Context Score Calculation
 * Determines how "contextual" vs "implementational" each pattern is
 */

import { PatternInput, Scale } from '../network-checker/types';

export interface ScoredPattern {
  pattern: PatternInput;
  contextScore: number;
  upRefs: number;
  downRefs: number;
}

/**
 * Calculate context score for a pattern within its scale
 * High score = frequently referenced as context (appears in others' connections_up)
 * Low score = frequently referenced as implementation (appears in others' connections_down)
 */
export function calculateContextScore(
  pattern: PatternInput,
  allPatterns: PatternInput[]
): ScoredPattern {
  let upRefs = 0;
  let downRefs = 0;

  for (const other of allPatterns) {
    if (other.id === pattern.id) continue;
    if (other.scale !== pattern.scale) continue;

    // Count how many same-scale patterns reference this one in their connections_up
    if (other.connections_up.includes(pattern.id)) {
      upRefs++;
    }
    // Count how many same-scale patterns reference this one in their connections_down
    if (other.connections_down.includes(pattern.id)) {
      downRefs++;
    }
  }

  return {
    pattern,
    contextScore: upRefs - downRefs,
    upRefs,
    downRefs,
  };
}

/**
 * Score all patterns in a collection
 */
export function scorePatterns(patterns: PatternInput[]): ScoredPattern[] {
  return patterns.map(p => calculateContextScore(p, patterns));
}

/**
 * Group patterns by scale
 */
export function groupByScale(
  patterns: PatternInput[]
): Record<Scale, PatternInput[]> {
  const groups: Record<Scale, PatternInput[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };

  for (const p of patterns) {
    groups[p.scale].push(p);
  }

  return groups;
}
