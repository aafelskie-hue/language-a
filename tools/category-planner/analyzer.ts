/**
 * Category Planner Analyzer
 * Core gap analysis for the pattern catalog
 */

import { loadPatternCatalog, loadCategoryCatalog, patternToSlot } from './parser.js';
import {
  type PatternInput,
  type Category,
  type AnalysisResult,
  type ScaleDistribution,
  type CategoryCoverage,
  type NetworkHealth,
  type ColdClimateMetrics,
  type TopicGap,
  SCALE_TARGETS,
  TARGET_PATTERNS,
  CATEGORY_CAPACITIES,
  COLD_CLIMATE_KEYWORDS,
} from './types.js';

/**
 * Main analysis orchestrator
 */
export async function analyzePatterns(): Promise<AnalysisResult> {
  const patterns = loadPatternCatalog();
  const categories = loadCategoryCatalog();

  const scaleDistribution = computeScaleDistribution(patterns);
  const categoryDistribution = computeCategoryDistribution(patterns, categories);
  const networkHealth = computeNetworkHealth(patterns);
  const coldClimateMetrics = computeColdClimateMetrics(patterns);
  const topicGaps = analyzeTopicGapsLocal(patterns);

  return {
    scaleDistribution,
    categoryDistribution,
    networkHealth,
    coldClimateMetrics,
    topicGaps,
    existingPatterns: patterns.length,
    targetPatterns: TARGET_PATTERNS,
    slotsNeeded: TARGET_PATTERNS - patterns.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compute scale distribution metrics
 */
export function computeScaleDistribution(patterns: PatternInput[]): ScaleDistribution {
  const total = patterns.length;

  const neighborhood = patterns.filter(p => p.scale === 'neighborhood').length;
  const building = patterns.filter(p => p.scale === 'building').length;
  const construction = patterns.filter(p => p.scale === 'construction').length;

  return {
    neighborhood,
    building,
    construction,
    neighborhoodPct: total > 0 ? neighborhood / total : 0,
    buildingPct: total > 0 ? building / total : 0,
    constructionPct: total > 0 ? construction / total : 0,
    total,
    targets: {
      neighborhoodMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.neighborhood.min),
      neighborhoodMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.neighborhood.max),
      buildingMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.building.min),
      buildingMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.building.max),
      constructionMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.construction.min),
      constructionMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.construction.max),
    },
  };
}

/**
 * Compute category distribution and coverage
 */
export function computeCategoryDistribution(
  patterns: PatternInput[],
  categories: Category[]
): CategoryCoverage[] {
  return categories.map(category => {
    const categoryPatterns = patterns.filter(p => p.category === category.id);
    const estimated = CATEGORY_CAPACITIES[category.id] || 20;

    const scales = {
      neighborhood: categoryPatterns.filter(p => p.scale === 'neighborhood').length,
      building: categoryPatterns.filter(p => p.scale === 'building').length,
      construction: categoryPatterns.filter(p => p.scale === 'construction').length,
    };

    const scaleCount = [scales.neighborhood, scales.building, scales.construction]
      .filter(c => c > 0).length;

    return {
      categoryId: category.id,
      categoryLabel: category.label,
      existing: categoryPatterns.length,
      estimated,
      percentage: estimated > 0 ? (categoryPatterns.length / estimated) * 100 : 0,
      scales,
      hasMultipleScales: scaleCount >= 2,
    };
  });
}

/**
 * Compute network health metrics
 */
export function computeNetworkHealth(patterns: PatternInput[]): NetworkHealth {
  const patternIds = new Set(patterns.map(p => p.id));
  const orphans: number[] = [];
  const hubs: number[] = [];
  const deadReferences: Array<{ from: number; to: number }> = [];

  let totalConnections = 0;
  let scaleCrossingConnections = 0;

  for (const pattern of patterns) {
    const connections = [...pattern.connections_up, ...pattern.connections_down];
    const uniqueConnections = [...new Set(connections)];
    const connectionCount = uniqueConnections.length;

    totalConnections += connectionCount;

    // Check for orphans (< 3 connections)
    if (connectionCount < 3) {
      orphans.push(pattern.id);
    }

    // Check for hubs (> 8 connections)
    if (connectionCount > 8) {
      hubs.push(pattern.id);
    }

    // Check for dead references and scale crossings
    for (const connId of uniqueConnections) {
      if (!patternIds.has(connId)) {
        deadReferences.push({ from: pattern.id, to: connId });
      } else {
        // Check if this is a scale-crossing connection
        const connectedPattern = patterns.find(p => p.id === connId);
        if (connectedPattern && connectedPattern.scale !== pattern.scale) {
          scaleCrossingConnections++;
        }
      }
    }
  }

  const averageConnections = patterns.length > 0 ? totalConnections / patterns.length : 0;
  const scaleCrossingRate = totalConnections > 0 ? scaleCrossingConnections / totalConnections : 0;

  return {
    averageConnections,
    orphans,
    hubs,
    deadReferences,
    scaleCrossingRate,
    totalConnections,
  };
}

/**
 * Compute cold climate metrics
 */
export function computeColdClimateMetrics(patterns: PatternInput[]): ColdClimateMetrics {
  const coldClimateIds: number[] = [];
  const foundKeywords = new Set<string>();

  for (const pattern of patterns) {
    const text = `${pattern.problem} ${pattern.body} ${pattern.solution}`.toLowerCase();

    let isColdClimate = false;
    for (const keyword of COLD_CLIMATE_KEYWORDS) {
      if (text.includes(keyword)) {
        isColdClimate = true;
        foundKeywords.add(keyword);
      }
    }

    if (isColdClimate) {
      coldClimateIds.push(pattern.id);
    }
  }

  return {
    ids: coldClimateIds,
    rate: patterns.length > 0 ? coldClimateIds.length / patterns.length : 0,
    keywords: [...foundKeywords],
  };
}

/**
 * Local topic gap analysis (without AI)
 * Scans pattern bodies for referenced topics that could become patterns
 */
export function analyzeTopicGapsLocal(patterns: PatternInput[]): TopicGap[] {
  const gaps: TopicGap[] = [];

  // Common architectural/design terms that might indicate gaps
  const potentialTopics = [
    { term: 'frost-protected', category: 'climate-resilience', scale: 'construction' as const },
    { term: 'cross-ventilation', category: 'energy-envelope', scale: 'building' as const },
    { term: 'thermal mass', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'thermal bridge', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'vapor barrier', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'air sealing', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'passive solar', category: 'energy-envelope', scale: 'building' as const },
    { term: 'heat pump', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'ground source', category: 'energy-envelope', scale: 'construction' as const },
    { term: 'district heating', category: 'energy-envelope', scale: 'neighborhood' as const },
    { term: 'tool library', category: 'community-governance', scale: 'neighborhood' as const },
    { term: 'repair cafe', category: 'community-governance', scale: 'neighborhood' as const },
    { term: 'community workshop', category: 'community-governance', scale: 'building' as const },
    { term: 'accessible pathway', category: 'aging-accessibility', scale: 'neighborhood' as const },
    { term: 'universal design', category: 'aging-accessibility', scale: 'building' as const },
    { term: 'wayfinding', category: 'aging-accessibility', scale: 'building' as const },
    { term: 'snow load', category: 'northern-living', scale: 'construction' as const },
    { term: 'ice dam', category: 'northern-living', scale: 'construction' as const },
    { term: 'heated walkway', category: 'northern-living', scale: 'neighborhood' as const },
    { term: 'winter city', category: 'northern-living', scale: 'neighborhood' as const },
    { term: 'permafrost', category: 'northern-living', scale: 'construction' as const },
    { term: 'greywater', category: 'water-infrastructure', scale: 'building' as const },
    { term: 'rainwater', category: 'water-infrastructure', scale: 'building' as const },
    { term: 'rain garden', category: 'water-infrastructure', scale: 'neighborhood' as const },
    { term: 'bioswale', category: 'water-infrastructure', scale: 'neighborhood' as const },
    { term: 'play street', category: 'children-play', scale: 'neighborhood' as const },
    { term: 'adventure playground', category: 'children-play', scale: 'neighborhood' as const },
    { term: 'nature play', category: 'children-play', scale: 'building' as const },
  ];

  // Check which potential topics are referenced in patterns
  for (const topic of potentialTopics) {
    const referencedIn: number[] = [];

    for (const pattern of patterns) {
      const text = `${pattern.problem} ${pattern.body} ${pattern.solution}`.toLowerCase();
      if (text.includes(topic.term)) {
        referencedIn.push(pattern.id);
      }
    }

    // Only add as gap if referenced but not already a pattern
    const existsAsPattern = patterns.some(p =>
      p.name.toLowerCase().includes(topic.term) ||
      p.name.toLowerCase().replace(/-/g, ' ').includes(topic.term)
    );

    if (referencedIn.length > 0 && !existsAsPattern) {
      gaps.push({
        topic: topic.term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        source: 'pattern-body',
        referencedIn,
        suggestedCategory: topic.category,
        suggestedScale: topic.scale,
        priority: referencedIn.length >= 3 ? 'high' : referencedIn.length >= 2 ? 'medium' : 'low',
      });
    }
  }

  // Add cold climate gaps that are commonly needed
  const coldClimateGaps = [
    { topic: 'Snow Load Design', scale: 'construction' as const },
    { topic: 'Ice Dam Prevention', scale: 'construction' as const },
    { topic: 'Heated Walkway Systems', scale: 'neighborhood' as const },
    { topic: 'Winter City Public Space', scale: 'neighborhood' as const },
    { topic: 'Frost Heave Protection', scale: 'construction' as const },
    { topic: 'Winter Cycling Infrastructure', scale: 'neighborhood' as const },
    { topic: 'Enclosed Skyway Network', scale: 'building' as const },
    { topic: 'Cold Climate Entry Vestibule', scale: 'construction' as const },
  ];

  for (const gap of coldClimateGaps) {
    const existsAsPattern = patterns.some(p =>
      p.name.toLowerCase().includes(gap.topic.toLowerCase().split(' ')[0])
    );

    if (!existsAsPattern) {
      gaps.push({
        topic: gap.topic,
        source: 'cold-climate',
        referencedIn: [],
        suggestedCategory: 'northern-living',
        suggestedScale: gap.scale,
        priority: 'medium',
      });
    }
  }

  return gaps;
}

/**
 * Get slots needed per scale to reach targets
 */
export function computeSlotsNeeded(distribution: ScaleDistribution): {
  neighborhood: number;
  building: number;
  construction: number;
} {
  return {
    neighborhood: Math.max(0, distribution.targets.neighborhoodMin - distribution.neighborhood),
    building: Math.max(0, distribution.targets.buildingMin - distribution.building),
    construction: Math.max(0, distribution.targets.constructionMin - distribution.construction),
  };
}

/**
 * Convert existing patterns to slots
 */
export function convertPatternsToSlots(patterns: PatternInput[]): import('./types.js').PatternSlot[] {
  return patterns.map(patternToSlot);
}
