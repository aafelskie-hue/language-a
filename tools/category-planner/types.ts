/**
 * Category Planner Types
 * TypeScript interfaces for catalog planning system
 */

// Scale types
export type Scale = 'neighborhood' | 'building' | 'construction';
export type Confidence = 0 | 1 | 2;
export type PatternStatus = 'published' | 'candidate' | 'proposed';
export type SlotStatus = 'existing' | 'planned';
export type Priority = 'high' | 'medium' | 'low';

/**
 * Pattern input matching the existing patterns.json structure
 */
export interface PatternInput {
  id: number;
  name: string;
  number: string;
  scale: Scale;
  category: string;
  categoryLabel: string;
  confidence: Confidence;
  status: PatternStatus;
  problem: string;
  body: string;
  solution: string;
  connections_up: number[];
  connections_down: number[];
  tags?: string[];
}

/**
 * Category from categories.json
 */
export interface Category {
  id: string;
  label: string;
  number: string;
  scale: string;
  description: string;
  patternIds: number[];
}

/**
 * Pattern slot in the catalog plan
 */
export interface PatternSlot {
  id: number;
  name: string;
  scale: Scale;
  category: string;
  status: SlotStatus;
  brief: string;
  tension: string;
  connections: number[];
  coldClimate: boolean;
  alexanderRef?: number[];
  priority: Priority;
}

/**
 * Scale distribution metrics
 */
export interface ScaleDistribution {
  neighborhood: number;
  building: number;
  construction: number;
  neighborhoodPct: number;
  buildingPct: number;
  constructionPct: number;
  total: number;
  // Target ranges
  targets: {
    neighborhoodMin: number;
    neighborhoodMax: number;
    buildingMin: number;
    buildingMax: number;
    constructionMin: number;
    constructionMax: number;
  };
}

/**
 * Category coverage metrics
 */
export interface CategoryCoverage {
  categoryId: string;
  categoryLabel: string;
  existing: number;
  estimated: number;
  percentage: number;
  scales: {
    neighborhood: number;
    building: number;
    construction: number;
  };
  hasMultipleScales: boolean;
}

/**
 * Network health metrics
 */
export interface NetworkHealth {
  averageConnections: number;
  orphans: number[];
  hubs: number[];
  deadReferences: Array<{ from: number; to: number }>;
  scaleCrossingRate: number;
  totalConnections: number;
}

/**
 * Topic gap identified in analysis
 */
export interface TopicGap {
  topic: string;
  source: 'pattern-body' | 'vision-doc' | 'cold-climate' | 'alexander-ref';
  referencedIn: number[];
  suggestedCategory: string;
  suggestedScale: Scale;
  priority: Priority;
}

/**
 * Cold climate metrics
 */
export interface ColdClimateMetrics {
  ids: number[];
  rate: number;
  keywords: string[];
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  scaleDistribution: ScaleDistribution;
  categoryDistribution: CategoryCoverage[];
  networkHealth: NetworkHealth;
  coldClimateMetrics: ColdClimateMetrics;
  topicGaps: TopicGap[];
  existingPatterns: number;
  targetPatterns: number;
  slotsNeeded: number;
  timestamp: string;
}

/**
 * Vertical chain analysis
 */
export interface VerticalChain {
  neighborhoodId: number;
  buildingIds: number[];
  constructionIds: number[];
  complete: boolean;
}

/**
 * Validation report for catalog plan
 */
export interface ValidationReport {
  totalPatterns: number;
  scaleDistribution: ScaleDistribution;
  categoryDistribution: Record<string, {
    total: number;
    neighborhood: number;
    building: number;
    construction: number;
    hasMultipleScales: boolean;
  }>;
  networkHealth: NetworkHealth;
  verticalChains: {
    complete: number;
    broken: Array<{
      neighborhood: number;
      missingBuilding: boolean;
      missingConstruction: boolean;
    }>;
  };
  coldClimateRate: number;
  duplicateNames: string[];
  emptyFields: Array<{ id: number; field: string }>;
  verdict: 'VALID' | 'ISSUES' | 'INVALID';
  issues: string[];
}

/**
 * CLI options for planner command
 */
export interface PlannerOptions {
  analyze?: boolean;
  plan?: boolean;
  validate?: string;
  stats?: string;
  export?: string;
  output?: 'terminal' | 'json';
  minPerCategory?: number;
  maxPerCategory?: number;
}

/**
 * Category capacity estimates for planning
 */
export const CATEGORY_CAPACITIES: Record<string, number> = {
  'fifteen-minute-life': 28,
  'digital-age-dwelling': 30,
  'housing-diversity': 25,
  'climate-resilience': 30,
  'energy-envelope': 25,
  'food-water': 20,
  'adaptive-reuse': 22,
  'health-biophilia': 25,
  'community-governance': 25,
  'construction-making': 24,
  'foundation': 20,
  'northern-living': 20,
  'water-infrastructure': 18,
  'children-play': 18,
  'aging-accessibility': 18,
  'light-darkness': 18,
  'sound-silence': 15,
  'the-commons': 18,
  'density-done-right': 18,
};

/**
 * Scale distribution targets (percentages of 254)
 */
export const SCALE_TARGETS = {
  neighborhood: { min: 0.28, max: 0.35 }, // 70-90 patterns
  building: { min: 0.43, max: 0.51 },     // 110-130 patterns
  construction: { min: 0.16, max: 0.24 }, // 40-60 patterns
};

/**
 * Total target patterns
 */
export const TARGET_PATTERNS = 254;

/**
 * Cold climate detection keywords
 */
export const COLD_CLIMATE_KEYWORDS = [
  'cold',
  'winter',
  'frost',
  'snow',
  'thermal',
  'insulation',
  'heating',
  'envelope',
  'northern',
  'edmonton',
  '-30',
  'freeze',
  'ice',
  'arctic',
  'boreal',
];
