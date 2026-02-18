/**
 * Research Verification Agent Types
 * TypeScript interfaces for claim extraction and verification
 */

// Re-export base types from red-team
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
 * Claim type classification
 */
export type ClaimType =
  | 'STATISTIC'
  | 'CITATION'
  | 'PROGRAM'
  | 'ORGANIZATION'
  | 'HISTORICAL'
  | 'TECHNICAL';

/**
 * Claim importance level
 */
export type ClaimImportance = 'high' | 'low';

/**
 * Verification verdict categories
 */
export type VerificationVerdict =
  | 'VERIFIED'
  | 'PARTIALLY'
  | 'UNVERIFIED'
  | 'DISPUTED'
  | 'FABRICATED';

/**
 * Extracted claim from pattern text
 */
export interface ExtractedClaim {
  text: string;           // Exact quote from pattern
  claim: string;          // Distilled checkable assertion
  type: ClaimType;
  importance: ClaimImportance;
}

/**
 * Result of verifying a single claim
 */
export interface VerificationResult {
  claim: ExtractedClaim;
  verdict: VerificationVerdict;
  confidence: number;     // 0.0–1.0
  summary: string;
  detail: string;
  sources: string[];
}

/**
 * Complete verification report for a pattern
 */
export interface PatternVerification {
  patternId: number;
  patternName: string;
  timestamp: string;
  model: string;
  totalClaims: number;
  results: VerificationResult[];
  summary: VerificationSummary;
}

/**
 * Summary statistics for a pattern's verification
 */
export interface VerificationSummary {
  verified: number;
  partially: number;
  unverified: number;
  disputed: number;
  fabricated: number;
  highImportanceIssues: VerificationResult[];
  suggestedConfidenceImpact: string;
}

/**
 * Overall pattern verdict
 */
export type PatternVerdict = 'CLEAN' | 'CAUTION' | 'FAIL';

/**
 * Batch verification summary
 */
export interface BatchVerificationSummary {
  total: number;
  patternsClean: number;
  patternsWithIssues: number;
  patternsWithGaps: number;
  totalClaims: number;
  claimBreakdown: {
    verified: number;
    partially: number;
    unverified: number;
    disputed: number;
    fabricated: number;
  };
  worstOffenders: {
    patternId: number;
    patternName: string;
    disputed: number;
    fabricated: number;
  }[];
  timestamp: string;
}

/**
 * CLI options for verify command
 */
export interface VerifyOptions {
  id?: number;
  json?: boolean;
  batch?: string;
  strict?: boolean;
  extractOnly?: boolean;
  output?: 'terminal' | 'json';
  summary?: boolean;
  concurrency?: number;
  ids?: string;
  excludeVerdicts?: string;
  previousReport?: string;
  outputFile?: string;
}

/**
 * Result of checking if a verification failure was due to web search issues
 */
export interface WebSearchCheckResult {
  isWebSearchFailure: boolean;
  matchedPattern?: string;
}

/**
 * Signal to halt batch processing due to connectivity issues
 */
export interface BatchHaltSignal {
  shouldHalt: boolean;
  reason: string;
  completedCount: number;
  totalCount: number;
  consecutiveFailures: number;
}

/**
 * Result of verifying all claims, potentially with early halt
 */
export interface VerifyAllClaimsResult {
  results: VerificationResult[];
  halted: boolean;
  haltSignal?: BatchHaltSignal;
}
