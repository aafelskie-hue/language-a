/**
 * Pattern Generator Types
 * TypeScript interfaces for pattern drafting
 */

export type Scale = 'neighborhood' | 'building' | 'construction';
export type Priority = 'high' | 'medium' | 'low';
export type SlotStatus = 'existing' | 'planned';

export interface PatternSlot {
  id: number;
  name: string;
  scale: Scale;
  category: string;
  categoryLabel?: string;
  status: SlotStatus;
  brief: string;
  tension: string;
  connections: number[];
  coldClimate: boolean;
  alexanderRef?: number[];
  priority: Priority;
}

export interface PatternInput {
  id: number;
  name: string;
  number: string;
  scale: Scale;
  category: string;
  categoryLabel: string;
  confidence: number;
  status: string;
  problem: string;
  body: string;
  solution: string;
  connections_up: number[];
  connections_down: number[];
  tags?: string[];
}

export interface GenerationContext {
  slot: PatternSlot;
  connectedPatterns: PatternInput[];
  categoryPatterns: PatternInput[];
  scaleNeighbors: PatternInput[];
  verticalChain: {
    above: PatternSlot[];
    below: PatternSlot[];
  };
  andrewContext?: string;
  existingDraft?: string;
  redTeamFeedback?: string;
  research?: ResearchResult;
}

export interface ResearchResult {
  programs: {
    name: string;
    location: string;
    year: string;
    outcome: string;
    source: string;
  }[];
  statistics: {
    claim: string;
    source: string;
    year: string;
  }[];
  studies: {
    authors: string;
    title: string;
    year: string;
    finding: string;
  }[];
  examples: {
    location: string;
    description: string;
    source: string;
  }[];
  evidenceStrength: 'strong' | 'moderate' | 'thin';
  suggestedConfidence: 0 | 1 | 2;
  notes: string;
}

export interface GenerationResult {
  patternId: number;
  patternName: string;
  draftPath: string;
  confidence: number;
  researchUsed: boolean;
  autoReviseAttempts: number;
  finalRedTeamVerdict?: string;
  finalRedTeamScore?: number;
  timestamp: string;
  model: string;
}

export interface BatchGenerationSummary {
  total: number;
  generated: number;
  passedRedTeam: number;
  needsHumanReview: number;
  failed: number;
  averageRedTeamScore: number;
  averageReviseAttempts: number;
  byPriority: {
    high: { total: number; generated: number; passed: number };
    medium: { total: number; generated: number; passed: number };
    low: { total: number; generated: number; passed: number };
  };
}

export interface GeneratorOptions {
  id?: number;
  brief?: string;
  context?: string;
  batch?: boolean;
  priority?: Priority;
  category?: string;
  from?: number;
  to?: number;
  revise?: string;
  feedback?: string;
  gate?: boolean;
  research?: boolean;
  autoRevise?: number;
  output?: 'terminal' | 'json';
}

// API configuration
export const DRAFT_MODEL = 'claude-sonnet-4-5-20250929';
export const RESEARCH_MODEL = 'claude-sonnet-4-5-20250929';
export const REVISE_MODEL = 'claude-sonnet-4-5-20250929';

export const DRAFT_TEMPERATURE = 0.6;
export const RESEARCH_TEMPERATURE = 0.1;
export const REVISE_TEMPERATURE = 0.4;

export const DRAFT_MAX_TOKENS = 4096;
export const RESEARCH_MAX_TOKENS = 4096;
