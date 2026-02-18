/**
 * Research Verification Agent Checker
 * Verify claims via Claude Code CLI with web search
 */

import { runClaudeForJson, delay } from '../lib/claude-cli.js';
import { buildVerificationPrompt } from './prompt.js';
import type {
  ExtractedClaim,
  VerificationResult,
  VerificationVerdict,
  WebSearchCheckResult,
  BatchHaltSignal,
  VerifyAllClaimsResult,
} from './types.js';

/**
 * Patterns that indicate web search failed (not a real verification failure)
 */
const WEB_SEARCH_FAILURE_PATTERNS = [
  'unable to verify due to lack of web search',
  'unable to search',
  'web search access',
  'permission restrictions',
  'tool permission',
  'web search not available',
  'cannot perform web search',
  'no web search capability',
  'search functionality unavailable',
];

/**
 * Check if a verification result indicates web search failure
 */
export function isWebSearchFailure(result: VerificationResult): WebSearchCheckResult {
  const detailLower = result.detail.toLowerCase();
  const summaryLower = result.summary.toLowerCase();

  for (const pattern of WEB_SEARCH_FAILURE_PATTERNS) {
    if (detailLower.includes(pattern) || summaryLower.includes(pattern)) {
      return { isWebSearchFailure: true, matchedPattern: pattern };
    }
  }

  return { isWebSearchFailure: false };
}

/**
 * Tracks consecutive web search failures and determines pause/halt actions
 */
export class ConnectivityTracker {
  private consecutiveFailures: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  /**
   * Record a verification result and determine next action
   * @returns 'continue' | 'pause_30s' | 'pause_2m' | 'halt'
   */
  recordResult(result: VerificationResult): 'continue' | 'pause_30s' | 'pause_2m' | 'halt' {
    const check = isWebSearchFailure(result);

    if (check.isWebSearchFailure) {
      this.consecutiveFailures++;
      this.totalFailures++;

      if (this.consecutiveFailures >= 10) {
        return 'halt';
      } else if (this.consecutiveFailures >= 5) {
        return 'pause_2m';
      } else if (this.consecutiveFailures >= 3) {
        return 'pause_30s';
      }
    } else {
      // Successful verification - reset consecutive failure count
      this.resetFailureCount();
      this.totalSuccesses++;
    }

    return 'continue';
  }

  /**
   * Reset consecutive failure count (called on successful verification)
   */
  resetFailureCount(): void {
    this.consecutiveFailures = 0;
  }

  /**
   * Get current state for progress reporting
   */
  getState(): { consecutiveFailures: number; totalFailures: number; totalSuccesses: number } {
    return {
      consecutiveFailures: this.consecutiveFailures,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }
}

/**
 * Verify a single claim using web search with retry logic
 */
export async function verifyClaim(
  claim: ExtractedClaim,
  maxRetries: number = 3
): Promise<VerificationResult> {
  let lastError: Error | null = null;

  const userPrompt = `Verify this claim:\n\nType: ${claim.type}\nClaim: "${claim.claim}"\nOriginal text: "${claim.text}"\n\nSearch for evidence and return your verdict.`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await runClaudeForJson<{
        verdict: VerificationVerdict;
        confidence: number;
        summary: string;
        detail: string;
        sources?: string[];
      }>(userPrompt, {
        systemPrompt: buildVerificationPrompt(),
        useWebSearch: true,
        timeout: 180000, // 3 minutes for web search
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        // Return unverified if parsing fails (don't retry parse errors)
        return {
          claim,
          verdict: 'UNVERIFIED',
          confidence: 0.5,
          summary: 'Failed to parse verification response',
          detail: `Error parsing response: No data returned`,
          sources: [],
        };
      }

      return {
        claim,
        verdict: validateVerdict(result.data.verdict),
        confidence: Math.max(0, Math.min(1, result.data.confidence || 0.5)),
        summary: result.data.summary || 'No summary provided',
        detail: result.data.detail || 'No detail provided',
        sources: result.data.sources || [],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // For errors, use exponential backoff
      if (attempt < maxRetries - 1) {
        const backoff = Math.pow(2, attempt) * 2000;
        console.log(`\nAPI error. Retrying in ${backoff / 1000}s...`);
        await delay(backoff);
        continue;
      }
    }
  }

  // All retries exhausted
  return {
    claim,
    verdict: 'UNVERIFIED',
    confidence: 0,
    summary: 'Verification failed after retries',
    detail: `Error: ${lastError?.message || 'Unknown error'}`,
    sources: [],
  };
}

/**
 * Validate verdict value
 */
function validateVerdict(verdict: string): VerificationVerdict {
  const valid: VerificationVerdict[] = [
    'VERIFIED',
    'PARTIALLY',
    'UNVERIFIED',
    'DISPUTED',
    'FABRICATED',
  ];

  if (valid.includes(verdict as VerificationVerdict)) {
    return verdict as VerificationVerdict;
  }

  console.warn(`Invalid verdict "${verdict}", defaulting to "UNVERIFIED"`);
  return 'UNVERIFIED';
}

/**
 * Verify all claims with progress reporting, rate limiting, and connectivity tracking
 */
export async function verifyAllClaims(
  claims: ExtractedClaim[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
    onConnectivityPause?: (action: string, failures: number) => void;
    onHalt?: (signal: BatchHaltSignal) => void;
  }
): Promise<VerifyAllClaimsResult> {
  const results: VerificationResult[] = [];
  const tracker = new ConnectivityTracker();

  for (let i = 0; i < claims.length; i++) {
    const result = await verifyClaim(claims[i]);
    results.push(result);

    if (options?.onProgress) options.onProgress(i + 1, claims.length);

    // Check connectivity status
    const action = tracker.recordResult(result);
    const state = tracker.getState();

    switch (action) {
      case 'pause_30s':
        if (options?.onConnectivityPause) {
          options.onConnectivityPause('30s pause', state.consecutiveFailures);
        }
        await delay(30000);
        break;

      case 'pause_2m':
        if (options?.onConnectivityPause) {
          options.onConnectivityPause('2 minute pause', state.consecutiveFailures);
        }
        await delay(120000);
        break;

      case 'halt':
        const haltSignal: BatchHaltSignal = {
          shouldHalt: true,
          reason: `${state.consecutiveFailures} consecutive web search failures detected`,
          completedCount: i + 1,
          totalCount: claims.length,
          consecutiveFailures: state.consecutiveFailures,
        };
        if (options?.onHalt) {
          options.onHalt(haltSignal);
        }
        return { results, halted: true, haltSignal };

      case 'continue':
      default:
        // Rate limiting: 5-second delay between verification calls
        // (each call involves web search which can be resource intensive)
        if (i < claims.length - 1) {
          await delay(5000);
        }
        break;
    }
  }

  return { results, halted: false };
}
