/**
 * Red Team Agent Types
 * TypeScript interfaces for pattern review system
 */

// Re-export base types from main app
export type Scale = 'neighborhood' | 'building' | 'construction';
export type Confidence = 0 | 1 | 2;
export type PatternStatus = 'published' | 'candidate' | 'proposed';

/**
 * Pattern input matching the existing pattern structure
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
 * Lightweight pattern reference for catalog context
 */
export interface PatternIndex {
  id: number;
  name: string;
  scale: Scale;
  category: string;
  confidence: Confidence;
}

/**
 * Score for a single rubric dimension
 */
export type DimensionScore = 'Pass' | 'Needs Work' | 'Fail';

/**
 * Detailed assessment for a single dimension
 */
export interface DimensionAssessment {
  dimension: string;
  score: DimensionScore;
  reasoning: string;
  suggestions?: string[];
}

/**
 * Final verdict for pattern review
 */
export type Verdict = 'PUBLISH' | 'REVISE' | 'RETHINK';

/**
 * Complete review result for a pattern
 */
export interface ReviewResult {
  patternId: number;
  patternName: string;
  verdict: Verdict;
  overallScore: number; // 0-10
  dimensions: DimensionAssessment[];
  summary: string;
  criticalIssues: string[];
  overlappingPatterns?: number[];
  timestamp: string;
}

/**
 * Batch review summary statistics
 */
export interface BatchSummary {
  totalPatterns: number;
  reviewed: number;
  publishReady: number;
  needsRevision: number;
  needsRethink: number;
  averageScore: number;
  byScale: {
    neighborhood: { count: number; avgScore: number };
    building: { count: number; avgScore: number };
    construction: { count: number; avgScore: number };
  };
  commonIssues: Array<{ issue: string; count: number }>;
  timestamp: string;
}

/**
 * CLI options for review command
 */
export interface ReviewOptions {
  id?: number;
  json?: boolean;
  batch?: string;
  strict?: boolean;
  output?: 'terminal' | 'json';
  summary?: boolean;
  compare?: boolean;
}

/**
 * Rubric dimension definition
 */
export interface RubricDimension {
  name: string;
  weight: number;
  description: string;
  passConditions: string[];
  failConditions: string[];
  redFlags: string[];
}
