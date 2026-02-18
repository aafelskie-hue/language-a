/**
 * Red Team Agent API
 * Core pattern review functionality using Claude Code CLI
 */

import 'dotenv/config';
import { runClaudeForJson } from '../lib/claude-cli.js';
import { buildSystemPrompt, buildUserPrompt, buildComparePrompt, getDimensionNames } from './prompt.js';
import { calculateOverallScore, determineVerdict } from './rubric.js';
import type { ReviewResult, DimensionAssessment, Verdict, PatternInput } from './types.js';

/**
 * Review a single pattern using Claude Code CLI
 */
export async function reviewPattern(
  pattern: PatternInput,
  options: { strict?: boolean; compare?: boolean } = {}
): Promise<ReviewResult> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = options.compare
    ? buildComparePrompt(pattern, [...pattern.connections_up, ...pattern.connections_down])
    : buildUserPrompt(pattern);

  const result = await runClaudeForJson<{
    dimensions: Array<{
      dimension: string;
      score: string;
      reasoning: string;
      suggestions?: string[];
    }>;
    summary: string;
    criticalIssues: string[];
    overlappingPatterns?: number[];
    verdict: string;
  }>(userPrompt, {
    systemPrompt,
    timeout: 300000, // 5 minutes
  });

  if (result.error || !result.data) {
    throw new Error(`Failed to get review response: ${result.error || 'No data returned'}`);
  }

  const parsed = result.data;

  // Validate and transform dimensions
  const validDimensions = getDimensionNames();
  const dimensions: DimensionAssessment[] = parsed.dimensions.map((d) => {
    if (!validDimensions.includes(d.dimension)) {
      console.warn(`Unknown dimension: ${d.dimension}`);
    }
    return {
      dimension: d.dimension,
      score: validateScore(d.score),
      reasoning: d.reasoning,
      suggestions: d.suggestions,
    };
  });

  // Calculate overall score
  const overallScore = calculateOverallScore(dimensions);

  // Determine verdict (use strict mode if requested)
  const verdict = options.strict
    ? determineVerdict(dimensions, true)
    : validateVerdict(parsed.verdict);

  return {
    patternId: pattern.id,
    patternName: pattern.name,
    verdict,
    overallScore,
    dimensions,
    summary: parsed.summary,
    criticalIssues: parsed.criticalIssues || [],
    overlappingPatterns: parsed.overlappingPatterns,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate score value
 */
function validateScore(score: string): 'Pass' | 'Needs Work' | 'Fail' {
  if (score === 'Pass' || score === 'Needs Work' || score === 'Fail') {
    return score;
  }
  console.warn(`Invalid score "${score}", defaulting to "Needs Work"`);
  return 'Needs Work';
}

/**
 * Validate verdict value
 */
function validateVerdict(verdict: string): Verdict {
  if (verdict === 'PUBLISH' || verdict === 'REVISE' || verdict === 'RETHINK') {
    return verdict;
  }
  console.warn(`Invalid verdict "${verdict}", defaulting to "REVISE"`);
  return 'REVISE';
}
