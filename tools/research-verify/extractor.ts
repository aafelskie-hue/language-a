/**
 * Research Verification Agent Extractor
 * Extract verifiable claims from pattern text using Claude Code CLI
 */

import { runClaudeForJson } from '../lib/claude-cli.js';
import { buildExtractionPrompt } from './prompt.js';
import type { PatternInput, ExtractedClaim } from './types.js';

/**
 * Extract all verifiable claims from a pattern
 */
export async function extractClaims(
  pattern: PatternInput
): Promise<ExtractedClaim[]> {
  // Combine all pattern text for extraction
  const patternText = [
    `# ${pattern.name}`,
    `**Problem:** ${pattern.problem}`,
    `**Evidence:** ${pattern.body}`,
    `**Therefore:** ${pattern.solution}`,
  ].join('\n\n');

  const userPrompt = `Extract all verifiable claims from this pattern:\n\n${patternText}`;

  const result = await runClaudeForJson<ExtractedClaim[]>(userPrompt, {
    systemPrompt: buildExtractionPrompt(),
    timeout: 60000, // 1 minute
  });

  if (result.error || !result.data) {
    console.error('Failed to extract claims:', result.error);
    console.error('Raw response:', result.raw);
    return [];
  }

  return validateClaims(result.data);
}

/**
 * Validate and clean extracted claims
 */
function validateClaims(claims: unknown[]): ExtractedClaim[] {
  const validTypes = [
    'STATISTIC',
    'CITATION',
    'PROGRAM',
    'ORGANIZATION',
    'HISTORICAL',
    'TECHNICAL',
  ];
  const validImportance = ['high', 'low'];

  return claims
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      text: String(c.text || ''),
      claim: String(c.claim || ''),
      type: validTypes.includes(String(c.type)) ? (String(c.type) as ExtractedClaim['type']) : 'STATISTIC',
      importance: validImportance.includes(String(c.importance))
        ? (String(c.importance) as ExtractedClaim['importance'])
        : 'low',
    }))
    .filter((c) => c.text.length > 0 && c.claim.length > 0);
}

/**
 * Format pattern for review (same as red-team)
 */
export function formatPatternForExtraction(pattern: PatternInput): string {
  const confidenceStars = '\u2605'.repeat(pattern.confidence) + '\u2606'.repeat(2 - pattern.confidence);

  return `# Pattern ${pattern.number}: ${pattern.name} ${confidenceStars}

**Scale:** ${pattern.scale}
**Category:** ${pattern.categoryLabel}
**Status:** ${pattern.status}

## Problem

${pattern.problem}

## Evidence & Context

${pattern.body}

## Solution

${pattern.solution}
`;
}
