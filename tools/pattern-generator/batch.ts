/**
 * Pattern Generator Batch Processing
 * Batch generation with auto-revise loop
 */

import { draftPattern } from './drafter.js';
import { revisePatternById } from './reviser.js';
import { getSlotsByPriority, getSlotsByCategory, getSlotsByRange, getDraftPath } from './context.js';
import {
  formatProgress,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatBatchSummary,
  formatRevisionStatus,
} from './formatter.js';
import type { GenerationResult, BatchGenerationSummary, PatternSlot } from './types.js';

export interface BatchOptions {
  useResearch?: boolean;
  andrewContext?: string;
  autoReviseAttempts?: number;
  runRedTeam?: boolean;
  quiet?: boolean;
  onProgress?: (message: string, current: number, total: number) => void;
}

export interface BatchResult {
  summary: BatchGenerationSummary;
  results: GenerationResult[];
  errors: { id: number; name: string; error: string }[];
}

/**
 * Generate patterns by priority
 */
export async function generateByPriority(
  priority: 'high' | 'medium' | 'low',
  options: BatchOptions = {}
): Promise<BatchResult> {
  const slots = getSlotsByPriority(priority);
  return generateBatch(slots, options);
}

/**
 * Generate patterns by category
 */
export async function generateByCategory(
  category: string,
  options: BatchOptions = {}
): Promise<BatchResult> {
  const slots = getSlotsByCategory(category);
  return generateBatch(slots, options);
}

/**
 * Generate patterns in ID range
 */
export async function generateByRange(
  from: number,
  to: number,
  options: BatchOptions = {}
): Promise<BatchResult> {
  const slots = getSlotsByRange(from, to);
  return generateBatch(slots, options);
}

/**
 * Generate a batch of patterns
 */
export async function generateBatch(
  slots: PatternSlot[],
  options: BatchOptions = {}
): Promise<BatchResult> {
  const results: GenerationResult[] = [];
  const errors: { id: number; name: string; error: string }[] = [];

  const byPriority = {
    high: { total: 0, generated: 0, passed: 0 },
    medium: { total: 0, generated: 0, passed: 0 },
    low: { total: 0, generated: 0, passed: 0 },
  };

  // Count by priority
  for (const slot of slots) {
    byPriority[slot.priority].total++;
  }

  let passedRedTeam = 0;
  let needsHumanReview = 0;
  let totalRedTeamScore = 0;
  let totalReviseAttempts = 0;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    if (options.onProgress) {
      options.onProgress(`Drafting ${slot.name}...`, i, slots.length);
    } else if (!options.quiet) {
      console.log(formatProgress(`Drafting ${slot.name}...`, i, slots.length));
    }

    try {
      // Initial draft
      let result = await draftPattern(slot.id, {
        andrewContext: options.andrewContext,
        useResearch: options.useResearch,
      });

      // Auto-revise loop if enabled and Red Team is available
      if (options.autoReviseAttempts && options.autoReviseAttempts > 0 && options.runRedTeam) {
        let attempts = 0;
        let shouldRevise = true;

        while (shouldRevise && attempts < options.autoReviseAttempts) {
          // Run Red Team review
          const redTeamResult = await runRedTeamReview(result.draftPath);

          if (redTeamResult) {
            result.finalRedTeamVerdict = redTeamResult.verdict;
            result.finalRedTeamScore = redTeamResult.score;
            totalRedTeamScore += redTeamResult.score;

            if (redTeamResult.verdict === 'PUBLISH') {
              shouldRevise = false;
              passedRedTeam++;
            } else if (redTeamResult.verdict === 'REVISE' && attempts < options.autoReviseAttempts) {
              attempts++;
              totalReviseAttempts++;

              if (!options.quiet) {
                console.log(formatRevisionStatus(slot.name, attempts, options.autoReviseAttempts));
              }

              // Revise with Red Team feedback
              result = await revisePatternById(slot.id, redTeamResult.feedback, {
                andrewContext: options.andrewContext,
              });
              result.autoReviseAttempts = attempts;
            } else {
              // REJECT or max attempts reached
              shouldRevise = false;
              needsHumanReview++;
            }
          } else {
            // Red Team failed, continue without it
            shouldRevise = false;
          }
        }
      } else {
        // No auto-revise, all go to human review
        needsHumanReview++;
      }

      results.push(result);
      byPriority[slot.priority].generated++;

      if (result.finalRedTeamVerdict === 'PUBLISH') {
        byPriority[slot.priority].passed++;
      }

      if (!options.quiet) {
        console.log(formatSuccess(`  ${slot.id}. ${slot.name}`));
      }
    } catch (error) {
      errors.push({
        id: slot.id,
        name: slot.name,
        error: error instanceof Error ? error.message : String(error),
      });

      if (!options.quiet) {
        console.log(formatError(`  ${slot.id}. ${slot.name}: ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    // Rate limiting delay
    if (i < slots.length - 1) {
      await sleep(500);
    }
  }

  const summary: BatchGenerationSummary = {
    total: slots.length,
    generated: results.length,
    passedRedTeam,
    needsHumanReview,
    failed: errors.length,
    averageRedTeamScore: results.length > 0 && totalRedTeamScore > 0
      ? totalRedTeamScore / results.filter(r => r.finalRedTeamScore !== undefined).length
      : 0,
    averageReviseAttempts: results.length > 0
      ? totalReviseAttempts / results.length
      : 0,
    byPriority,
  };

  return { summary, results, errors };
}

/**
 * Run Red Team review on a draft
 * Returns null if Red Team is not available
 */
async function runRedTeamReview(draftPath: string): Promise<{
  verdict: string;
  score: number;
  feedback: string;
} | null> {
  // Note: This would integrate with the red-team tool
  // For now, return null to skip auto-revise loop
  // TODO: Import and call red-team review function
  return null;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a batch generation session
 */
export async function runBatchSession(
  filter: {
    priority?: 'high' | 'medium' | 'low';
    category?: string;
    from?: number;
    to?: number;
  },
  options: BatchOptions = {}
): Promise<BatchResult> {
  let slots: PatternSlot[] = [];

  if (filter.priority) {
    slots = getSlotsByPriority(filter.priority);
  } else if (filter.category) {
    slots = getSlotsByCategory(filter.category);
  } else if (filter.from !== undefined && filter.to !== undefined) {
    slots = getSlotsByRange(filter.from, filter.to);
  }

  if (slots.length === 0) {
    return {
      summary: {
        total: 0,
        generated: 0,
        passedRedTeam: 0,
        needsHumanReview: 0,
        failed: 0,
        averageRedTeamScore: 0,
        averageReviseAttempts: 0,
        byPriority: {
          high: { total: 0, generated: 0, passed: 0 },
          medium: { total: 0, generated: 0, passed: 0 },
          low: { total: 0, generated: 0, passed: 0 },
        },
      },
      results: [],
      errors: [],
    };
  }

  if (!options.quiet) {
    console.log(formatInfo(`Starting batch generation of ${slots.length} patterns`));
    console.log('');
  }

  const result = await generateBatch(slots, options);

  if (!options.quiet) {
    console.log('');
    console.log(formatBatchSummary(result.summary));
  }

  return result;
}

/**
 * Get batch generation statistics
 */
export function getBatchStats(results: GenerationResult[]): {
  totalConfidence: number;
  averageConfidence: number;
  byConfidence: Record<number, number>;
  withResearch: number;
  withoutResearch: number;
} {
  const byConfidence: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  let totalConfidence = 0;
  let withResearch = 0;
  let withoutResearch = 0;

  for (const result of results) {
    byConfidence[result.confidence] = (byConfidence[result.confidence] || 0) + 1;
    totalConfidence += result.confidence;

    if (result.researchUsed) {
      withResearch++;
    } else {
      withoutResearch++;
    }
  }

  return {
    totalConfidence,
    averageConfidence: results.length > 0 ? totalConfidence / results.length : 0,
    byConfidence,
    withResearch,
    withoutResearch,
  };
}
