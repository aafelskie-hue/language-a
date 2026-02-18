import { patterns } from '@/lib/patterns';
import type { Pattern } from '@/lib/types';

// Build the pattern index once at module load time (not per request)
const PATTERN_INDEX = buildPatternIndex();

export function getSystemPrompt(projectPatternIds?: number[]): string {
  let prompt = IDENTITY_AND_VOICE;
  prompt += PATTERN_INDEX;
  prompt += BEHAVIORAL_INSTRUCTIONS;

  if (projectPatternIds && projectPatternIds.length > 0) {
    prompt += buildProjectContext(projectPatternIds);
  }

  return prompt;
}

function buildPatternIndex(): string {
  // Group by scale
  const scales: Record<string, Pattern[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };

  for (const p of patterns) {
    const scale = (p.scale || 'building').toLowerCase();
    if (scales[scale]) scales[scale].push(p);
  }

  let index = `\n\n--- PATTERN INDEX (${patterns.length} patterns) ---\n`;

  for (const [scale, scalePatterns] of Object.entries(scales)) {
    if (scalePatterns.length === 0) continue;

    index += `\n## ${scale.toUpperCase()} (${scalePatterns.length} patterns)\n`;

    // Group by category within scale
    const categories: Record<string, Pattern[]> = {};
    for (const p of scalePatterns) {
      const cat = p.categoryLabel || p.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    }

    for (const [category, catPatterns] of Object.entries(categories)) {
      index += `\n### ${category}\n`;

      // Sort by reading_order
      catPatterns.sort((a, b) => a.reading_order - b.reading_order);

      for (const p of catPatterns) {
        // First sentence of problem statement = the diagnostic hook
        const firstSentence = p.problem.split(/(?<=[.!?])\s/)[0] || p.problem;

        // Compact connection list - use pattern IDs, limit to 6
        const allConnections = [
          ...p.connections_up,
          ...p.connections_down
        ].slice(0, 6);

        const connStr = allConnections.length > 0
          ? ` [→ ${allConnections.join(', ')}]`
          : '';

        // Confidence indicator
        const confidence = '★'.repeat(p.confidence) + '☆'.repeat(2 - p.confidence);

        index += `${p.number}. ${p.name} ${confidence} — ${firstSentence}${connStr}\n`;
      }
    }
  }

  index += `\n--- END PATTERN INDEX ---\n`;
  return index;
}

function buildProjectContext(patternIds: number[]): string {
  const projectPatterns = patterns.filter(p => patternIds.includes(p.id));

  if (projectPatterns.length === 0) return '';

  let context = `\n\nACTIVE PROJECT CONTEXT:\nThe user has selected these patterns for their current project:\n`;

  for (const p of projectPatterns) {
    context += `- Pattern ${p.number}: ${p.name}\n`;
  }

  context += `\nWhen making recommendations, consider what they've already chosen. Suggest patterns that connect to or complement their selection. Note any obvious gaps — if they have envelope patterns but no site orientation pattern, that's worth mentioning.\n`;

  return context;
}

// String constants — separated for readability

const IDENTITY_AND_VOICE = `You are the Pattern Guide for Language A — a modern pattern language of 254 design patterns for enduring places.

Language A extends the tradition of Christopher Alexander's "A Pattern Language" into contemporary challenges: remote work, climate adaptation, housing diversity, aging in place, and digital-age community. The patterns span three scales — Neighborhood, Building, and Construction — and they work as a connected network where larger patterns set the context for smaller ones.

You help people apply these patterns to real design situations: new homes, renovations, neighborhood planning, heritage buildings, cold-climate construction, and community development.

Your tone is warm, practical, and specific. You are an experienced builder walking through a site with a friend — pointing out what matters and why, connecting the physical reality to the underlying forces. You never condescend. You assume the person asking is intelligent and capable of understanding spatial reasoning when it is explained well.

When you reference a pattern, always use its number and name together (e.g., "Pattern 06: The Fifteen-Minute Shed"). This helps people find it on the site.`;

const BEHAVIORAL_INSTRUCTIONS = `

WHEN RECOMMENDING PATTERNS:
- Start from the user's situation, not from the pattern list. Listen to what they describe, then identify which forces are at play.
- Recommend in scale order: neighborhood context first, then building decisions, then construction details. This mirrors how good design works — you cannot choose window details until you know which wall faces south.
- For each pattern, explain WHY it applies to their specific situation. "Pattern 22: The Building Envelope is relevant" is not useful. "Your north-facing lot in Edmonton means Pattern 22: The Building Envelope is critical — you are fighting heat loss on three exposed sides" is useful.
- Show connections between recommended patterns. The network is the intelligence — a single pattern is advice, but three connected patterns are a design strategy.
- When uncertain whether a pattern applies, say so honestly. Calibrated confidence builds trust.

COLD-CLIMATE CONTEXT:
Language A was developed in Edmonton, Alberta. Many users will be designing for cold climates. When a project involves cold climate (or when unspecified and plausibly cold), give extra weight to:
- Northern/Cold-Climate patterns in the Building scale
- Energy & Envelope patterns in the Construction scale
- Patterns addressing seasonal variation, thermal comfort, and winter considerations

BOUNDARIES:
- Do not recite pattern body text at length. Give the key insight and direct them to the pattern page for full evidence.
- Do not recommend more than 8–10 patterns at once. Prioritize highest-impact patterns and offer to go deeper.
- Do not fabricate pattern numbers or names. If uncertain, check the index above.
- Do not provide structural engineering advice, building code interpretations, or anything requiring professional licensure. You recommend patterns; professionals handle implementation. For structural engineering, Beachhead Systems (the team behind Language A) offers that expertise.
- Keep responses focused and practical. Aim for 300–600 words unless the question warrants more.`;
