/**
 * Pattern Generator Prompts
 * System prompts for drafting, research, and revision
 */

import type { GenerationContext, PatternSlot, ResearchResult } from './types.js';
import { getCategoryLabel } from './context.js';

/**
 * Build the main drafting prompt
 */
export function buildDraftingPrompt(context: GenerationContext): string {
  const slot = context.slot;
  const categoryLabel = slot.categoryLabel || getCategoryLabel(slot.category);

  const connectedPatternsText = context.connectedPatterns.length > 0
    ? context.connectedPatterns.map(p => `### ${p.id}. ${p.name} [${p.scale}]
Problem: ${p.problem}
Solution: ${p.solution}
`).join('\n')
    : 'No connected patterns have been written yet.';

  const verticalAboveText = context.verticalChain.above.length > 0
    ? `Larger-scale patterns this implements:
${context.verticalChain.above.map(s => `- ${s.id}. ${s.name} [${s.scale}]: ${s.brief}`).join('\n')}`
    : 'This is the largest-scale pattern in its chain.';

  const verticalBelowText = context.verticalChain.below.length > 0
    ? `Smaller-scale patterns that detail this one:
${context.verticalChain.below.map(s => `- ${s.id}. ${s.name} [${s.scale}]: ${s.brief}`).join('\n')}`
    : 'This is the smallest-scale pattern in its chain.';

  const andrewContextText = context.andrewContext
    ? `## Andrew's Notes\n\n${context.andrewContext}`
    : '';

  const researchText = context.research
    ? buildResearchSection(context.research)
    : '';

  return `You are drafting a pattern for Language A — a collection of 254 design patterns for neighborhoods, buildings, and construction. Written from Edmonton, Alberta (53°N, -30°C winters, 17 hours of summer daylight). Grounded in forces that don't change.

## The Pattern You Are Writing

Title: ${slot.name}
ID: ${slot.id}
Scale: ${slot.scale}
Category: ${categoryLabel}
Brief: ${slot.brief}
Tension: ${slot.tension}
Connections: ${slot.connections.join(', ')}
Cold-climate relevant: ${slot.coldClimate}
${slot.alexanderRef ? `Alexander references: ${slot.alexanderRef.join(', ')}` : ''}

## Connected Patterns (Full Text)

These are the patterns this one connects to. Read them carefully. Your pattern must fit structurally with these — the connections should be real dependencies, not thematic associations.

${connectedPatternsText}

## Vertical Chain

${verticalAboveText}

${verticalBelowText}

${andrewContextText}

${researchText}

## How to Write a Pattern

Follow Christopher Alexander's format exactly:

### 1. Opening Connections (one line)
"…beyond [PATTERN A] (id), [PATTERN B] (id), and [PATTERN C] (id)…"
Name 2-4 larger-scale patterns that provide context for this one. Use patterns from Language A (IDs 1-254) and/or Alexander's originals (mark as "Alexander [number]").

### 2. Problem Statement (one bold paragraph)
State the design tension — TWO OR MORE FORCES IN CONFLICT. Not advocacy for a position. Not a conclusion. The reader should feel the pull of both sides.

Format: "When [condition], [force A] suffers because [force B] demands the opposite."

WRONG: "When cities don't invest in bike lanes, cyclists are unsafe." (advocacy)
RIGHT: "When daily needs require a car to reach, people spend hours in transit, neighborhoods lose their social fabric, and the elderly and young become dependent on those who can drive." (tension between access, independence, and community)

### 3. Evidence (2-4 paragraphs)
Build the case with SPECIFIC, VERIFIABLE evidence:
- Name the city, the year, the program, the measurement
- Cite the study, the author, the finding
- Give the number, the percentage, the cost
- Show where this has been built, tested, measured

NEVER use: "Research shows..." "Studies suggest..." "Experts agree..."
ALWAYS use: "Philadelphia's Green City program installed 2,800 greened acres..." "Ward et al. (2017) found that..."

${slot.coldClimate ? `This is a cold-climate pattern. Use Edmonton-specific evidence where possible. Reference Canadian programs, northern European examples, or cold-climate research. Be specific about temperatures, frost lines, snow loads, heating degree days, and seasonal daylight variation.` : ''}

Connect to Alexander where relevant. Show how this pattern extends, updates, or fills a gap in his original 253.

### 4. Therefore (one bold paragraph)
State the design solution as a SPATIAL MOVE AN ARCHITECT COULD DRAW.

Include at least one TESTABLE CRITERION — something you can measure, count, observe, or model. The best tests are physical and simple.

WRONG: "Therefore: ensure communities have access to adequate green space." (policy)
RIGHT: "Therefore: on every lot, direct roof and driveway runoff to a planted depression — a rain garden — before it reaches the storm drain. Size the garden to absorb a two-year storm event." (spatial, specific, testable)

### 5. Closing Connections (one line)
"…this pattern connects to [PATTERN X] (id), [PATTERN Y] (id), and [PATTERN Z] (id)…"
Name 2-4 smaller-scale patterns that help implement this one.

## Voice

Write like Alexander: warm, specific, authoritative, grounded in human experience. Use concrete sensory language — what you can see, touch, hear, feel. Speak directly to the reader. Be occasionally beautiful.

NOT academic: "This pattern addresses the intersection of thermal performance and occupant wellbeing."
NOT policy: "Municipalities should consider implementing incentive programs."
NOT marketing: "Transform your living experience with nature-inspired design."

YES: "The room you survive in when the power goes out during a heat wave."
YES: "Reachable in pajamas, in February, in the dark."
YES: "A garden that is beautiful, ecologically alive, and fire-resistant — not a moonscape with a house in the middle."

## Constraints

- 500-800 words total (problem + evidence + therefore). Tight, not bloated.
- Every factual claim must be specific and verifiable. No hand-waving.
- Connections must reference real pattern IDs from the catalog.
- The "therefore" must pass the napkin test: could an architect sketch it?
- Include a testable criterion — a hard physical test if possible.
- Confidence rating: assign ★★, ★, or ☆ honestly based on the evidence you're using.
  ★★ = evidence from 3+ independent contexts with measurements
  ★ = evidence from 1-2 contexts with reasonable theory
  ☆ = theoretical, extrapolated, speculative but well-reasoned

## Output Format

Return the complete pattern as markdown with YAML frontmatter:

\`\`\`markdown
---
id: ${slot.id}
name: "${slot.name}"
scale: "${slot.scale}"
category: "${slot.category}"
categoryLabel: "${categoryLabel}"
confidence: [0, 1, or 2]
status: "candidate"
connections_up: [list of IDs]
connections_down: [list of IDs]
coldClimate: ${slot.coldClimate}
tags: [relevant tags]
---

# ${String(slot.id).padStart(2, '0')}. ${slot.name} [★★/★/☆]

**…beyond [PATTERN A] (id), [PATTERN B] (id)…**

**[Problem statement — the tension, in bold]**

[Evidence paragraph 1]

[Evidence paragraph 2]

[Evidence paragraph 3 if needed]

**Therefore: [Solution — the spatial move, in bold. Include testable criterion.]**

**…this pattern connects to [PATTERN X] (id), [PATTERN Y] (id)…**
\`\`\`

Return ONLY the markdown. No preamble, no commentary outside the pattern.`;
}

/**
 * Build research section from results
 */
function buildResearchSection(research: ResearchResult): string {
  const sections: string[] = ['## Verified Evidence\n'];

  if (research.programs.length > 0) {
    sections.push('### Programs and Policies');
    for (const p of research.programs) {
      sections.push(`- ${p.name} (${p.location}, ${p.year}): ${p.outcome} [${p.source}]`);
    }
    sections.push('');
  }

  if (research.statistics.length > 0) {
    sections.push('### Statistics');
    for (const s of research.statistics) {
      sections.push(`- ${s.claim} (${s.source}, ${s.year})`);
    }
    sections.push('');
  }

  if (research.studies.length > 0) {
    sections.push('### Studies');
    for (const s of research.studies) {
      sections.push(`- ${s.authors} (${s.year}): "${s.title}" — ${s.finding}`);
    }
    sections.push('');
  }

  if (research.examples.length > 0) {
    sections.push('### Built Examples');
    for (const e of research.examples) {
      sections.push(`- ${e.location}: ${e.description} [${e.source}]`);
    }
    sections.push('');
  }

  sections.push(`Evidence strength: ${research.evidenceStrength}`);
  sections.push(`Suggested confidence: ${research.suggestedConfidence === 2 ? '★★' : research.suggestedConfidence === 1 ? '★' : '☆'}`);
  if (research.notes) {
    sections.push(`Notes: ${research.notes}`);
  }

  return sections.join('\n');
}

/**
 * Build the research prompt
 */
export function buildResearchPrompt(slot: PatternSlot): string {
  const categoryLabel = slot.categoryLabel || getCategoryLabel(slot.category);

  return `You are researching evidence for a design pattern about: "${slot.name}"

Brief: ${slot.brief}
Tension: ${slot.tension}
Scale: ${slot.scale}
Category: ${categoryLabel}
Cold-climate relevant: ${slot.coldClimate}

Search for REAL, VERIFIABLE evidence. I need:

1. PROGRAMS: Real policies, initiatives, or programs related to this topic.
   For each: city/country, year implemented, specific outcomes with numbers.

2. STATISTICS: Specific numbers from credible sources.
   For each: the exact figure, the source organization, the year.

3. STUDIES: Academic papers or official reports.
   For each: author(s), title, year, journal/publisher, key finding.

4. BUILT EXAMPLES: Places where this design principle has been implemented.
   For each: location, what was built, measurable outcomes if available.

${slot.coldClimate ? `Prioritize cold-climate evidence: Canadian cities, Scandinavian countries, northern Japan, Russia, northern China. Edmonton-specific data is especially valuable.` : ''}

Rules:
- Only include evidence you can confirm through search. Do not invent citations.
- Primary sources over secondary. Government reports over news articles.
- Include the URL or specific source name for every item.
- If you can't find strong evidence for this topic, say so honestly. A pattern with thin evidence should have a ☆ confidence rating, not fabricated citations.
- Aim for at least 3 items per category, but quality over quantity.

Return a JSON object:
{
  "programs": [{ "name": "", "location": "", "year": "", "outcome": "", "source": "" }],
  "statistics": [{ "claim": "", "source": "", "year": "" }],
  "studies": [{ "authors": "", "title": "", "year": "", "finding": "" }],
  "examples": [{ "location": "", "description": "", "source": "" }],
  "evidenceStrength": "strong" | "moderate" | "thin",
  "suggestedConfidence": 0 | 1 | 2,
  "notes": "Any caveats about evidence quality"
}`;
}

/**
 * Build the revision prompt
 */
export function buildRevisionPrompt(
  originalDraft: string,
  feedback: string,
  context: GenerationContext
): string {
  return `You are revising a Language A pattern that did not pass quality review.

## Original Draft

${originalDraft}

## Quality Gate Feedback

${feedback}

## Revision Instructions

Fix ONLY what the feedback identifies. Do not rewrite sections that weren't flagged. Preserve the voice, structure, and content that works.

Specific rules:
- If spatial specificity was flagged: add physical dimensions, materials, relationships to other building elements. The "therefore" must pass the napkin test.
- If evidence quality was flagged: replace vague claims with specific, cited evidence. If a claim was marked FABRICATED or DISPUTED, remove it entirely and replace with verified evidence. If marked PARTIALLY, adjust the language to match what's actually verifiable.
- If problem statement was flagged: rewrite as a genuine tension between competing forces. Both sides must be named.
- If voice was flagged: remove academic, policy, or marketing language. Add sensory detail. Make it warmer and more specific.
- If testability was flagged: add a hard, physical test criterion to the "therefore."
- If confidence was flagged: adjust the rating to match the evidence. Downgrade if necessary.
- If network integration was flagged: fix connection references to real pattern IDs. Ensure connections are structural dependencies.

Return the complete revised pattern in the same markdown format. Do not explain your changes — just return the revised pattern.`;
}

/**
 * Build system prompt for drafting
 */
export function buildDraftingSystemPrompt(): string {
  return `You are a pattern language author in the tradition of Christopher Alexander. You write design patterns for Language A — a collection of 254 patterns for neighborhoods, buildings, and construction, written from Edmonton, Alberta.

Your patterns are:
- Specific and spatial, not abstract or policy-oriented
- Grounded in verifiable evidence with named sources
- Warm and authoritative in voice
- Structured as problem → evidence → therefore

You output only markdown patterns. No preamble, no commentary.`;
}

/**
 * Build system prompt for research
 */
export function buildResearchSystemPrompt(): string {
  return `You are a research assistant gathering evidence for design patterns. You search for real, verifiable information about architecture, urban design, and building practices.

You return only JSON with properly sourced evidence. You do not fabricate citations or statistics. If evidence is thin, you say so honestly.`;
}
