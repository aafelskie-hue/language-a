/**
 * Pattern Generator Drafter
 * Core drafting logic using Claude Code CLI
 */

import 'dotenv/config';
import { runClaude, runClaudeForJson } from '../lib/claude-cli.js';
import { buildDraftingPrompt, buildResearchPrompt, buildDraftingSystemPrompt, buildResearchSystemPrompt } from './prompt.js';
import { buildContext, saveDraft, saveResearch, getSlotById } from './context.js';
import type {
  GenerationContext,
  GenerationResult,
  ResearchResult,
  PatternSlot,
} from './types.js';

// Model identifier for tracking
const MODEL_ID = 'claude-code-cli';

/**
 * Draft a single pattern
 */
export async function draftPattern(
  slotId: number,
  options: {
    andrewContext?: string;
    useResearch?: boolean;
  } = {}
): Promise<GenerationResult> {
  const slot = getSlotById(slotId);
  if (!slot) {
    throw new Error(`Slot ${slotId} not found in catalog plan`);
  }

  // Build context
  const context = buildContext(slotId, {
    andrewContext: options.andrewContext,
  });

  // Run research if requested
  if (options.useResearch) {
    const research = await runResearch(slot);
    context.research = research;
    saveResearch(slot.id, slot.name, research);
  }

  // Generate draft
  const draft = await generateDraft(context);

  // Save draft
  const draftPath = saveDraft(slot.id, slot.name, draft);

  // Extract confidence from draft
  const confidence = extractConfidence(draft);

  return {
    patternId: slot.id,
    patternName: slot.name,
    draftPath,
    confidence,
    researchUsed: options.useResearch || false,
    autoReviseAttempts: 0,
    timestamp: new Date().toISOString(),
    model: MODEL_ID,
  };
}

/**
 * Generate the draft using Claude Code CLI
 */
async function generateDraft(context: GenerationContext): Promise<string> {
  const systemPrompt = buildDraftingSystemPrompt();
  const userPrompt = buildDraftingPrompt(context);

  const result = await runClaude(userPrompt, {
    systemPrompt,
    timeout: 180000, // 3 minutes
  });

  if (!result.success) {
    throw new Error(`Failed to generate draft: ${result.error}`);
  }

  // Clean up the response
  let draft = result.text.trim();

  // Remove markdown code fences if present
  const codeMatch = draft.match(/```(?:markdown)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    draft = codeMatch[1].trim();
  } else if (draft.startsWith('```')) {
    // Handle unclosed fence
    const lines = draft.split('\n');
    draft = lines.slice(1).join('\n').trim();
  }

  return draft;
}

/**
 * Run research for a pattern
 */
async function runResearch(slot: PatternSlot): Promise<ResearchResult> {
  const systemPrompt = buildResearchSystemPrompt();
  const userPrompt = buildResearchPrompt(slot);

  const result = await runClaudeForJson<ResearchResult>(userPrompt, {
    systemPrompt,
    useWebSearch: true, // Research needs web search
    timeout: 180000, // 3 minutes
  });

  if (result.error || !result.data) {
    console.error('Failed to parse research JSON:', result.error);
    // Return empty research on failure
    return {
      programs: [],
      statistics: [],
      studies: [],
      examples: [],
      evidenceStrength: 'thin',
      suggestedConfidence: 0,
      notes: 'Research parsing failed',
    };
  }

  return normalizeResearch(result.data);
}

/**
 * Normalize research result
 */
function normalizeResearch(research: Partial<ResearchResult>): ResearchResult {
  return {
    programs: research.programs || [],
    statistics: research.statistics || [],
    studies: research.studies || [],
    examples: research.examples || [],
    evidenceStrength: research.evidenceStrength || 'thin',
    suggestedConfidence: typeof research.suggestedConfidence === 'number' ? research.suggestedConfidence : 0,
    notes: research.notes || '',
  };
}

/**
 * Extract confidence rating from draft
 */
function extractConfidence(draft: string): number {
  // Look for confidence in frontmatter
  const confMatch = draft.match(/confidence:\s*(\d)/);
  if (confMatch) {
    return parseInt(confMatch[1], 10);
  }

  // Look for stars in title
  if (draft.includes('★★')) return 2;
  if (draft.includes('★')) return 1;
  if (draft.includes('☆')) return 0;

  return 1; // Default
}

/**
 * Check if Claude CLI is available
 */
export function hasApiKey(): boolean {
  // With CLI approach, we don't need an API key - claude CLI handles auth
  return true;
}
