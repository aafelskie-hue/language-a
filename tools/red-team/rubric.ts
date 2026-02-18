/**
 * Red Team Agent Rubric
 * Seven-dimension editorial rubric for Language A pattern evaluation
 */

import type { RubricDimension } from './types.js';

export const rubricDimensions: RubricDimension[] = [
  {
    name: 'Problem Statement',
    weight: 1.5,
    description: 'Does the pattern articulate a genuine design tension rather than advocate for a position?',
    passConditions: [
      'Describes a specific conflict between competing needs or forces',
      'Avoids prescriptive language ("we should", "we must")',
      'Presents the problem as a recurring situation, not a single case',
      'Acknowledges trade-offs inherent in any solution',
    ],
    failConditions: [
      'Reads as advocacy for a cause rather than design guidance',
      'Problem is so general it applies to everything (e.g., "people need good places")',
      'Problem assumes its own solution ("when neighborhoods lack X, they need X")',
      'Uses moralistic framing instead of functional description',
    ],
    redFlags: [
      'Contains "should" or "must" in the problem statement',
      'Problem statement is longer than the solution',
      'References political movements or ideologies by name',
    ],
  },
  {
    name: 'Spatial Specificity',
    weight: 1.5,
    description: 'Can a designer actually draw or build this pattern?',
    passConditions: [
      'Describes physical characteristics (dimensions, relationships, materials)',
      'Can be sketched or modeled in physical space',
      'Addresses a specific scale (neighborhood, building, or construction detail)',
      'Relates to tangible spatial elements, not abstract concepts',
    ],
    failConditions: [
      'Describes policy, governance, or social arrangements without spatial form',
      'Could apply equally to a website, organization, or physical space',
      'Solution is entirely about behavior, culture, or values',
      'No physical form is implied or required',
    ],
    redFlags: [
      'Pattern could be implemented without any construction or spatial change',
      'Primary focus is on rules, policies, or governance structures',
      'No mention of dimensions, proportions, or spatial relationships',
    ],
  },
  {
    name: 'Evidence Quality',
    weight: 1.0,
    description: 'Is the pattern backed by specific, verifiable evidence?',
    passConditions: [
      'Cites specific research, studies, or documented examples',
      'References named projects, places, or researchers',
      'Includes quantifiable data or measurable outcomes',
      'Distinguishes between established knowledge and speculation',
    ],
    failConditions: [
      'Uses weasel phrases ("studies show", "experts agree", "research suggests")',
      'Makes claims without attribution or source',
      'Relies entirely on common sense or intuition',
      'Conflates correlation with causation',
    ],
    redFlags: [
      'Contains "studies show" without naming the studies',
      'Uses "many", "most", or "some" without specifics',
      'Claims are unfalsifiable or immune to evidence',
    ],
  },
  {
    name: 'Network Integration',
    weight: 1.0,
    description: 'Does the pattern connect structurally to related patterns at higher and lower scales?',
    passConditions: [
      'References specific pattern numbers that provide context (connections_up)',
      'References specific pattern numbers that implement details (connections_down)',
      'Connections are structural, not merely thematic',
      'Pattern occupies a clear position in the scale hierarchy',
    ],
    failConditions: [
      'Connections are purely thematic ("also about sustainability")',
      'Pattern is isolated with few or no meaningful connections',
      'Connections cross scales inappropriately',
      'Referenced patterns don\'t actually relate to this one',
    ],
    redFlags: [
      'Fewer than 2 connections in either direction',
      'All connections are within the same category',
      'Connections feel forced or arbitrary',
    ],
  },
  {
    name: 'Alexandrian Voice',
    weight: 1.0,
    description: 'Does the writing achieve warmth and specificity without academic jargon?',
    passConditions: [
      'Uses concrete, sensory language',
      'Speaks directly to the reader ("you", "your")',
      'Avoids academic jargon and technical terminology',
      'Balances precision with accessibility',
    ],
    failConditions: [
      'Reads like an academic paper or policy document',
      'Heavy use of passive voice',
      'Relies on buzzwords or consultant-speak',
      'Cold, impersonal, or bureaucratic tone',
    ],
    redFlags: [
      'Contains terms like "stakeholders", "leverage", "synergy", "best practices"',
      'More than 3 sentences in a row without concrete imagery',
      'Could have been written by committee',
    ],
  },
  {
    name: 'Testability',
    weight: 1.0,
    description: 'Does the pattern include a verifiable success criterion?',
    passConditions: [
      'Solution includes measurable outcomes or thresholds',
      'Someone could verify whether the pattern was implemented correctly',
      'Success criteria relate to observable phenomena',
      'Criteria are specific enough to guide decisions',
    ],
    failConditions: [
      'No way to tell if the pattern was implemented successfully',
      'Success depends entirely on subjective judgment',
      'Criteria are so vague they\'re unfalsifiable',
      'Pattern describes intention rather than implementation',
    ],
    redFlags: [
      'Solution uses only qualitative terms ("adequate", "sufficient", "appropriate")',
      'No numbers, dimensions, or ratios anywhere in the pattern',
      'Success would require reading minds or measuring feelings',
    ],
  },
  {
    name: 'Confidence Rating Honesty',
    weight: 1.0,
    description: 'Does the confidence rating honestly reflect the quality of evidence?',
    passConditions: [
      'High confidence (2 stars) backed by multiple studies or proven implementations',
      'Moderate confidence (1 star) appropriately acknowledges uncertainty',
      'Speculative (0 stars) used for theoretical patterns without validation',
      'Rating matches the strength of evidence in the body',
    ],
    failConditions: [
      'High confidence claimed without strong evidence',
      'Evidence quality significantly exceeds or falls short of rating',
      'Rating seems arbitrary or disconnected from content',
      'Pattern makes strong claims with low confidence rating',
    ],
    redFlags: [
      'Two-star rating with no cited research or named examples',
      'Zero-star rating with extensive documented evidence',
      'Confidence rating contradicts hedging language in the text',
    ],
  },
];

/**
 * Get rubric as formatted text for prompt
 */
export function getRubricText(): string {
  return rubricDimensions
    .map((dim, index) => {
      const passText = dim.passConditions.map((c) => `    - ${c}`).join('\n');
      const failText = dim.failConditions.map((c) => `    - ${c}`).join('\n');
      const flagText = dim.redFlags.map((c) => `    - ${c}`).join('\n');

      return `${index + 1}. ${dim.name} (weight: ${dim.weight})
   ${dim.description}

   Pass conditions:
${passText}

   Fail conditions:
${failText}

   Red flags:
${flagText}`;
    })
    .join('\n\n');
}

/**
 * Calculate overall score from dimension assessments
 */
export function calculateOverallScore(
  assessments: Array<{ dimension: string; score: 'Pass' | 'Needs Work' | 'Fail' }>
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const assessment of assessments) {
    const dim = rubricDimensions.find((d) => d.name === assessment.dimension);
    if (!dim) continue;

    const weight = dim.weight;
    totalWeight += weight;

    const scoreValue = assessment.score === 'Pass' ? 10 : assessment.score === 'Needs Work' ? 5 : 0;
    weightedScore += scoreValue * weight;
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0;
}

/**
 * Determine verdict based on dimension scores
 */
export function determineVerdict(
  assessments: Array<{ dimension: string; score: 'Pass' | 'Needs Work' | 'Fail' }>,
  strict: boolean = false
): 'PUBLISH' | 'REVISE' | 'RETHINK' {
  const failCount = assessments.filter((a) => a.score === 'Fail').length;
  const needsWorkCount = assessments.filter((a) => a.score === 'Needs Work').length;
  const passCount = assessments.filter((a) => a.score === 'Pass').length;

  // Check for critical dimension failures (Problem Statement or Spatial Specificity)
  const criticalDimensions = ['Problem Statement', 'Spatial Specificity'];
  const criticalFails = assessments.filter(
    (a) => criticalDimensions.includes(a.dimension) && a.score === 'Fail'
  );

  if (criticalFails.length > 0) {
    return 'RETHINK';
  }

  if (strict) {
    // Strict mode: all must pass
    if (failCount > 0 || needsWorkCount > 0) {
      return failCount > 0 ? 'RETHINK' : 'REVISE';
    }
    return 'PUBLISH';
  }

  // Normal mode
  if (failCount >= 2) {
    return 'RETHINK';
  }

  if (failCount >= 1 || needsWorkCount >= 3) {
    return 'REVISE';
  }

  if (needsWorkCount >= 1) {
    return passCount >= 5 ? 'PUBLISH' : 'REVISE';
  }

  return 'PUBLISH';
}
