/**
 * Category Planner Prompts
 * System and user prompts for AI-powered planning
 */

import type { PatternInput, Category, AnalysisResult } from './types.js';

/**
 * Build the system prompt for the catalog planner
 */
export function buildPlannerSystemPrompt(): string {
  return `You are a pattern language architect planning the complete catalog for Language A — a collection of 254 design patterns for neighborhoods, buildings, and construction. Written from Edmonton, Alberta, grounded in forces that don't change: climate, light, gravity, human need for shelter and community.

You follow Christopher Alexander's approach to pattern languages: each pattern names a problem that occurs repeatedly in our environment, describes the core tension, and proposes a solution that resolves the tension without creating new problems.

Your output is JSON only. No preamble, no commentary, no markdown code fences. Just the raw JSON array.`;
}

/**
 * Build the user prompt for full catalog planning
 */
export function buildPlannerUserPrompt(
  patterns: PatternInput[],
  categories: Category[],
  analysis: AnalysisResult
): string {
  const existingPatternsList = patterns
    .map(p => `${p.id}. ${p.name} [${p.scale}/${p.category}] — ${p.problem.slice(0, 80)}...`)
    .join('\n');

  const categoryList = categories
    .map(c => `${c.number}. ${c.label} — ${c.description}`)
    .join('\n');

  const gapsList = analysis.topicGaps
    .map(g => `- ${g.topic} (${g.suggestedCategory}, ${g.suggestedScale}) — referenced in ${g.referencedIn.length} patterns`)
    .join('\n');

  return `## Your Task

You have ${patterns.length} existing patterns. You need to propose ${254 - patterns.length} more to complete the language. For each new pattern slot, provide:
- id: sequential number starting at ${patterns.length + 1}
- name: concrete, evocative title (like Alexander's)
- scale: "neighborhood" | "building" | "construction"
- category: one of the category IDs
- status: "planned"
- brief: one line describing what this pattern is about
- tension: one sentence capturing the competing forces
- connections: array of pattern IDs (3-8 connections, mix existing and proposed)
- coldClimate: true if specifically relevant to northern/cold conditions
- alexanderRef: optional array of Alexander pattern numbers this relates to
- priority: "high" | "medium" | "low"

## The Existing Patterns (IDs 1-${patterns.length})

${existingPatternsList}

## Category Structure

${categoryList}

## Analysis of Current Gaps

Scale Distribution:
- Neighborhood: ${analysis.scaleDistribution.neighborhood} patterns (${(analysis.scaleDistribution.neighborhoodPct * 100).toFixed(0)}%) — target: 28-35%
- Building: ${analysis.scaleDistribution.building} patterns (${(analysis.scaleDistribution.buildingPct * 100).toFixed(0)}%) — target: 43-51%
- Construction: ${analysis.scaleDistribution.construction} patterns (${(analysis.scaleDistribution.constructionPct * 100).toFixed(0)}%) — target: 16-24%

Topic Gaps Detected:
${gapsList}

Cold Climate Coverage: ${(analysis.coldClimateMetrics.rate * 100).toFixed(0)}% — target: ≥15%

## Rules

1. SCALE BALANCE: Every category must have patterns at multiple scales. No single-scale categories.

2. NETWORK DENSITY: Every pattern must connect to 3–8 others. Connections must be structural (removing the connected pattern changes how this one works), not thematic.

3. VERTICAL COHERENCE: For every neighborhood pattern, propose at least one building pattern that implements it, and one construction pattern that details the building pattern. The language must flow from large to small.

4. COLD CLIMATE: At least 15% of patterns must be specifically relevant to cold climate, northern conditions, or Edmonton. Distribute these across categories.

5. NO ALEXANDER DUPLICATES: Do not propose patterns that duplicate Alexander's originals. You may reference his patterns in connections (using his original numbers), but every Language A pattern must cover NEW ground.

6. REALISTIC SCOPE: Each pattern must be specific enough to generate a problem-tension-evidence-therefore in 500–800 words. "Sustainable Design" is too broad. "The Frost-Protected Shallow Foundation" is right.

7. NAMING: Pattern names should be concrete and evocative. "Light on Two Sides of Every Room" not "Bilateral Fenestration Strategy."

8. EXISTING PATTERN IDs 1-${patterns.length} ARE FIXED. Do not rename, recategorize, or modify existing patterns.

## Output

Return a JSON array containing ALL 254 pattern slots:
- First ${patterns.length} entries should have status "existing" (represent the existing patterns)
- Remaining entries should have status "planned" (your proposals)

Think carefully about vertical coherence. For each neighborhood pattern, trace the chain: what building patterns implement it? What construction patterns detail those?

Think carefully about Edmonton at 53°N latitude, -30°C winters, 17 hours of summer daylight.

Return ONLY the JSON array. No preamble, no code fences, no commentary.`;
}

/**
 * Build prompt for AI-powered topic gap analysis
 */
export function buildTopicGapPrompt(patterns: PatternInput[]): string {
  const patternSummaries = patterns
    .map(p => `${p.id}. ${p.name}\nProblem: ${p.problem}\nSolution: ${p.solution}`)
    .join('\n\n');

  return `Analyze these ${patterns.length} patterns from Language A, a pattern language for neighborhoods, buildings, and construction written from Edmonton, Alberta.

Identify topic gaps — subjects mentioned in pattern bodies that deserve their own pattern but don't have one yet.

${patternSummaries}

For each gap you identify, provide:
- topic: The suggested pattern name
- source: "pattern-body" | "cold-climate" | "alexander-ref"
- referencedIn: Array of pattern IDs that mention this topic
- suggestedCategory: Best category for this topic
- suggestedScale: "neighborhood" | "building" | "construction"
- priority: "high" (referenced 3+ times) | "medium" (2 times) | "low" (1 time)

Focus especially on:
1. Topics mentioned multiple times across patterns
2. Cold-climate specific topics (Edmonton at -30°C)
3. Topics that would complete vertical chains (neighborhood → building → construction)
4. Topics from Alexander's original 253 that need modern updates

Return a JSON array of topic gaps. No preamble, no commentary.`;
}

/**
 * Build prompt for validating pattern connections
 */
export function buildConnectionValidationPrompt(
  slot: { id: number; name: string; scale: string; connections: number[] },
  connectedPatterns: PatternInput[]
): string {
  const connectionsList = connectedPatterns
    .map(p => `- ${p.id}. ${p.name} [${p.scale}]: ${p.problem.slice(0, 80)}...`)
    .join('\n');

  return `Validate the connections for this proposed pattern:

Pattern ${slot.id}: ${slot.name} [${slot.scale}]

Proposed connections:
${connectionsList}

For each connection, assess:
1. Is the connection structural (removing it changes how the pattern works)?
2. Is the connection directionally correct (larger scales create context for smaller)?
3. Are there better connection options?

Return JSON:
{
  "valid": boolean,
  "issues": string[],
  "suggestions": string[]
}`;
}
