/**
 * Pattern Generator Reviser
 * Revise drafts based on Red Team feedback using Claude Code CLI
 */

import 'dotenv/config';
import * as fs from 'fs';
import { runClaude } from '../lib/claude-cli.js';
import { buildRevisionPrompt, buildDraftingSystemPrompt } from './prompt.js';
import { buildContext, saveDraft, getSlotById, getDraftPath } from './context.js';
import type { GenerationContext, GenerationResult } from './types.js';

// Model identifier for tracking
const MODEL_ID = 'claude-code-cli';

/**
 * Revise a pattern draft based on feedback
 */
export async function revisePattern(
  draftPath: string,
  feedback: string,
  options: {
    andrewContext?: string;
  } = {}
): Promise<GenerationResult> {
  // Read the existing draft
  if (!fs.existsSync(draftPath)) {
    throw new Error(`Draft not found: ${draftPath}`);
  }
  const existingDraft = fs.readFileSync(draftPath, 'utf-8');

  // Extract pattern ID from draft frontmatter
  const idMatch = existingDraft.match(/^---[\s\S]*?id:\s*(\d+)[\s\S]*?---/m);
  if (!idMatch) {
    throw new Error('Could not extract pattern ID from draft frontmatter');
  }
  const patternId = parseInt(idMatch[1], 10);

  // Get the slot from catalog plan
  const slot = getSlotById(patternId);
  if (!slot) {
    throw new Error(`Pattern ${patternId} not found in catalog plan`);
  }

  // Build context with the existing draft and feedback
  const context = buildContext(patternId, {
    andrewContext: options.andrewContext,
    existingDraft,
    redTeamFeedback: feedback,
  });

  // Generate revised draft
  const revisedDraft = await generateRevision(existingDraft, feedback, context);

  // Save the revised draft (overwrites the original)
  const savedPath = saveDraft(slot.id, slot.name, revisedDraft);

  // Extract confidence from revised draft
  const confidence = extractConfidence(revisedDraft);

  return {
    patternId: slot.id,
    patternName: slot.name,
    draftPath: savedPath,
    confidence,
    researchUsed: false,
    autoReviseAttempts: 1,
    timestamp: new Date().toISOString(),
    model: MODEL_ID,
  };
}

/**
 * Generate revision using Claude Code CLI
 */
async function generateRevision(
  originalDraft: string,
  feedback: string,
  context: GenerationContext
): Promise<string> {
  const systemPrompt = buildDraftingSystemPrompt();
  const userPrompt = buildRevisionPrompt(originalDraft, feedback, context);

  const result = await runClaude(userPrompt, {
    systemPrompt,
    timeout: 180000, // 3 minutes
  });

  if (!result.success) {
    throw new Error(`Failed to generate revision: ${result.error}`);
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
 * Revise a pattern from its ID
 */
export async function revisePatternById(
  patternId: number,
  feedback: string,
  options: {
    andrewContext?: string;
  } = {}
): Promise<GenerationResult> {
  const slot = getSlotById(patternId);
  if (!slot) {
    throw new Error(`Pattern ${patternId} not found in catalog plan`);
  }

  const draftPath = getDraftPath(slot.id, slot.name);
  return revisePattern(draftPath, feedback, options);
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
 * Parse feedback string into structured format
 */
export function parseFeedback(feedback: string): {
  redTeam: string[];
  researchVerify: string[];
  other: string[];
} {
  const result = {
    redTeam: [] as string[],
    researchVerify: [] as string[],
    other: [] as string[],
  };

  // Split by common delimiters
  const parts = feedback.split(/[;|\n]+/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.toLowerCase().startsWith('rt:') || part.toLowerCase().startsWith('red team:')) {
      result.redTeam.push(part.replace(/^(rt:|red team:)\s*/i, ''));
    } else if (part.toLowerCase().startsWith('rv:') || part.toLowerCase().startsWith('research:')) {
      result.researchVerify.push(part.replace(/^(rv:|research:)\s*/i, ''));
    } else {
      result.other.push(part);
    }
  }

  return result;
}

/**
 * Check if Claude CLI is available
 */
export function hasApiKey(): boolean {
  // With CLI approach, we don't need an API key - claude CLI handles auth
  return true;
}
