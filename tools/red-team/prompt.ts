/**
 * Red Team Agent Prompt Construction
 * Build system prompts for pattern review
 */

import { getRubricText, rubricDimensions } from './rubric.js';
import { getPatternIndex, formatPatternForReview, formatConnectedPatterns } from './parser.js';
import type { PatternInput, PatternIndex } from './types.js';

/**
 * Build the system prompt for pattern review
 */
export function buildSystemPrompt(): string {
  const patternIndex = getPatternIndex();
  const catalogContext = formatPatternCatalog(patternIndex);

  return `You are a rigorous editorial reviewer for Language A, a pattern language for 21st-century dwelling. Your role is to evaluate patterns against a seven-dimension rubric before publication.

## Your Task

Review the submitted pattern and provide:
1. A score for each of the seven dimensions: "Pass", "Needs Work", or "Fail"
2. Specific reasoning for each score
3. Concrete suggestions for improvement where needed
4. A final verdict: PUBLISH, REVISE, or RETHINK

## The Seven-Dimension Rubric

${getRubricText()}

## Pattern Catalog (for Network Integration assessment)

${catalogContext}

## Scoring Guidelines

- **Pass**: The pattern fully meets the dimension's criteria
- **Needs Work**: Minor issues that can be fixed with editing
- **Fail**: Fundamental problems that require reconceptualization

## Verdict Determination

- **PUBLISH**: All dimensions pass, or minor issues only (5+ Pass, no Fails)
- **REVISE**: Some dimensions need work but fundamentals are sound (1-2 Fails, or 3+ Needs Work)
- **RETHINK**: Critical dimensions fail or pattern concept is flawed (Problem Statement or Spatial Specificity fails, or 3+ Fails)

## Output Format

Respond with a JSON object matching this structure:

\`\`\`json
{
  "dimensions": [
    {
      "dimension": "Problem Statement",
      "score": "Pass" | "Needs Work" | "Fail",
      "reasoning": "Specific explanation...",
      "suggestions": ["Concrete suggestion 1", "Concrete suggestion 2"]
    },
    // ... repeat for all 7 dimensions
  ],
  "summary": "One paragraph overall assessment",
  "criticalIssues": ["List of critical issues that must be addressed"],
  "overlappingPatterns": [8, 9], // Pattern IDs that significantly overlap
  "verdict": "PUBLISH" | "REVISE" | "RETHINK"
}
\`\`\`

Be thorough but fair. The goal is to help patterns become stronger, not to gatekeep. Provide actionable feedback.`;
}

/**
 * Format pattern catalog as compact reference
 */
function formatPatternCatalog(patterns: PatternIndex[]): string {
  const byScale: Record<string, PatternIndex[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };

  for (const p of patterns) {
    byScale[p.scale]?.push(p);
  }

  let result = '';
  for (const [scale, scalePatterns] of Object.entries(byScale)) {
    result += `\n### ${scale.charAt(0).toUpperCase() + scale.slice(1)} Scale\n`;
    for (const p of scalePatterns) {
      const stars = '★'.repeat(p.confidence) + '☆'.repeat(2 - p.confidence);
      result += `- ${p.id}. ${p.name} ${stars} [${p.category}]\n`;
    }
  }

  return result;
}

/**
 * Build the user prompt for reviewing a specific pattern
 */
export function buildUserPrompt(pattern: PatternInput): string {
  const patternText = formatPatternForReview(pattern);
  const connectedContext = formatConnectedPatterns(pattern);

  return `Please review the following pattern:

${patternText}

## Connected Pattern Context

${connectedContext}

Evaluate this pattern against all seven rubric dimensions and provide your assessment in the specified JSON format.`;
}

/**
 * Build extended prompt for overlap detection between patterns
 */
export function buildComparePrompt(pattern: PatternInput, compareIds: number[]): string {
  const basePrompt = buildUserPrompt(pattern);

  return `${basePrompt}

## Additional Task: Overlap Analysis

Pay special attention to potential overlap or redundancy with these patterns: ${compareIds.join(', ')}

For each potentially overlapping pattern, assess:
1. Is there conceptual redundancy?
2. Could they be merged?
3. Do they address distinct enough problems to coexist?
4. Are the connections between them appropriate?

Include your overlap analysis in the "overlappingPatterns" field of your response.`;
}

/**
 * Get dimension names for validation
 */
export function getDimensionNames(): string[] {
  return rubricDimensions.map((d) => d.name);
}
