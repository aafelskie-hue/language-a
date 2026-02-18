/**
 * Category Planner Proposer
 * Claude Code CLI integration for catalog plan generation
 */

import 'dotenv/config';
import { runClaude, runClaudeForJson, extractJson } from '../lib/claude-cli.js';
import { buildPlannerSystemPrompt, buildPlannerUserPrompt, buildTopicGapPrompt } from './prompt.js';
import { loadPatternCatalog, loadCategoryCatalog, patternToSlot } from './parser.js';
import { analyzePatterns } from './analyzer.js';
import type { PatternSlot, TopicGap, AnalysisResult, PatternInput, Category } from './types.js';

/**
 * Generate the complete 254-pattern catalog plan
 */
export async function generateCatalogPlan(
  analysis?: AnalysisResult
): Promise<PatternSlot[]> {
  const patterns = loadPatternCatalog();
  const categories = loadCategoryCatalog();

  // Use provided analysis or compute fresh
  const analysisResult = analysis || await analyzePatterns();

  const systemPrompt = buildPlannerSystemPrompt();
  const userPrompt = buildPlannerUserPrompt(patterns, categories, analysisResult);

  const result = await runClaude(userPrompt, {
    systemPrompt,
    timeout: 600000, // 10 minutes for large generation
  });

  if (!result.success) {
    throw new Error(`Failed to generate catalog plan: ${result.error}`);
  }

  // Parse JSON from response (handle possible markdown code fences)
  let jsonStr = result.text.trim();

  // Remove markdown code fences if present (handle both complete and truncated)
  jsonStr = extractJson(jsonStr);

  let slots: PatternSlot[];
  try {
    slots = JSON.parse(jsonStr);
  } catch (e) {
    // If parsing fails, try to repair truncated JSON array
    const repaired = repairTruncatedJson(jsonStr);
    try {
      slots = JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`Failed to parse JSON response: ${e}\n\nRaw response:\n${jsonStr.slice(0, 500)}...`);
    }
  }

  // Validate basic structure
  if (!Array.isArray(slots)) {
    throw new Error('Response is not an array');
  }

  // Merge with existing patterns as slots
  const existingSlots = patterns.map(patternToSlot);

  // Replace existing slots in the AI response with actual existing patterns
  const mergedSlots: PatternSlot[] = [];
  for (let i = 0; i < 254; i++) {
    const id = i + 1;
    const existingSlot = existingSlots.find(s => s.id === id);
    const aiSlot = slots.find(s => s.id === id);

    if (existingSlot) {
      mergedSlots.push(existingSlot);
    } else if (aiSlot) {
      mergedSlots.push(normalizeSlot(aiSlot));
    } else {
      // Generate placeholder for missing slots
      mergedSlots.push({
        id,
        name: `[Placeholder ${id}]`,
        scale: 'building',
        category: 'foundation',
        status: 'planned',
        brief: 'Placeholder — needs AI regeneration',
        tension: '',
        connections: [],
        coldClimate: false,
        priority: 'low',
      });
    }
  }

  return mergedSlots;
}

/**
 * Generate topic gaps using AI analysis
 */
export async function generateTopicGaps(patterns?: PatternInput[]): Promise<TopicGap[]> {
  const patternData = patterns || loadPatternCatalog();
  const userPrompt = buildTopicGapPrompt(patternData);

  const result = await runClaudeForJson<TopicGap[]>(userPrompt, {
    systemPrompt: 'You analyze pattern languages and identify gaps. Return only valid JSON arrays.',
    timeout: 120000, // 2 minutes
  });

  if (result.error || !result.data) {
    throw new Error(`Failed to generate topic gaps: ${result.error}`);
  }

  return result.data.map(normalizeTopicGap);
}

/**
 * Normalize a slot from AI response
 */
function normalizeSlot(slot: Partial<PatternSlot> & { id: number }): PatternSlot {
  return {
    id: slot.id,
    name: slot.name || `[Unnamed ${slot.id}]`,
    scale: normalizeScale(slot.scale),
    category: slot.category || 'foundation',
    status: slot.status === 'existing' ? 'existing' : 'planned',
    brief: slot.brief || '',
    tension: slot.tension || '',
    connections: Array.isArray(slot.connections) ? slot.connections : [],
    coldClimate: Boolean(slot.coldClimate),
    alexanderRef: Array.isArray(slot.alexanderRef) ? slot.alexanderRef : undefined,
    priority: normalizePriority(slot.priority),
  };
}

/**
 * Normalize scale value
 */
function normalizeScale(scale: unknown): PatternSlot['scale'] {
  if (scale === 'neighborhood' || scale === 'building' || scale === 'construction') {
    return scale;
  }
  return 'building'; // Default
}

/**
 * Normalize priority value
 */
function normalizePriority(priority: unknown): PatternSlot['priority'] {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority;
  }
  return 'medium'; // Default
}

/**
 * Normalize topic gap from AI response
 */
function normalizeTopicGap(gap: Partial<TopicGap>): TopicGap {
  return {
    topic: gap.topic || '[Unknown Topic]',
    source: gap.source || 'pattern-body',
    referencedIn: Array.isArray(gap.referencedIn) ? gap.referencedIn : [],
    suggestedCategory: gap.suggestedCategory || 'foundation',
    suggestedScale: normalizeScale(gap.suggestedScale),
    priority: normalizePriority(gap.priority),
  };
}

/**
 * Check if Claude CLI is available
 */
export function hasApiKey(): boolean {
  // With CLI approach, we don't need an API key - claude CLI handles auth
  return true;
}

/**
 * Attempt to repair truncated JSON array
 */
function repairTruncatedJson(text: string): string {
  // Find the last complete object (ends with })
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1) {
    return text;
  }

  // Get everything up to and including the last complete object
  let repaired = text.substring(0, lastBrace + 1);

  // Count open brackets to determine what we need to close
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // Add closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }

  return repaired;
}
