/**
 * Research Verification Agent Batch Mode
 * Verify multiple patterns with rate limiting and caching using Claude Code CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { extractClaims } from './extractor.js';
import { verifyAllClaims } from './checker.js';
import { delay } from '../lib/claude-cli.js';
import {
  formatBatchSummary,
  formatVerificationResult,
  formatProgress,
  generateSummary,
  determineVerdict,
  formatHaltReport,
  formatTextReport,
} from './formatter.js';
import type {
  PatternInput,
  PatternVerification,
  BatchVerificationSummary,
  PatternVerdict,
  BatchHaltSignal,
  VerifyAllClaimsResult,
} from './types.js';

interface BatchOptions {
  strict?: boolean;
  outputFormat?: 'terminal' | 'json';
  summaryOnly?: boolean;
  concurrency?: number;
  filterIds?: number[];           // Only process these IDs
  excludeVerdicts?: string[];     // Skip patterns with these verdicts
  previousReport?: string;        // Path to previous report for verdict lookup
  outputFile?: string;            // Custom output path
}

// Paths
const CACHE_DIR = path.resolve(process.cwd(), 'tools/research-verify/cache');
const REPORTS_DIR = path.resolve(process.cwd(), 'tools/research-verify/reports');

/**
 * Generate hash for pattern content (for cache invalidation)
 */
function patternHash(pattern: PatternInput): string {
  const content = pattern.problem + pattern.body + pattern.solution;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Get cached verification result if valid
 */
function getCachedResult(pattern: PatternInput): PatternVerification | null {
  const hash = patternHash(pattern);
  const cachePath = path.join(CACHE_DIR, `pattern-${pattern.id}-${hash}.json`);

  if (fs.existsSync(cachePath)) {
    try {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(raw) as PatternVerification;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save verification result to cache
 */
function cacheResult(pattern: PatternInput, result: PatternVerification): void {
  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const hash = patternHash(pattern);
  const cachePath = path.join(CACHE_DIR, `pattern-${pattern.id}-${hash}.json`);
  fs.writeFileSync(cachePath, JSON.stringify(result, null, 2), 'utf-8');
}

/**
 * Run batch verification of patterns
 */
export async function runBatchVerification(
  sourcePath: string,
  options: BatchOptions = {}
): Promise<void> {
  let patterns = loadPatterns(sourcePath);

  if (patterns.length === 0) {
    console.error('No patterns found to verify');
    return;
  }

  // Apply filters
  const originalCount = patterns.length;
  patterns = filterPatterns(patterns, options);

  if (patterns.length === 0) {
    console.error('No patterns remaining after filtering');
    return;
  }

  if (patterns.length !== originalCount) {
    console.log(`Filtered from ${originalCount} to ${patterns.length} patterns`);
  }

  console.log(`Starting batch verification of ${patterns.length} patterns...`);
  console.log('');

  const results: PatternVerification[] = [];
  const startTime = Date.now();
  let cachedCount = 0;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];

    // Progress indicator
    if (options.outputFormat !== 'json') {
      process.stdout.write(
        `\r${formatProgress(i + 1, patterns.length, `Pattern ${pattern.id}: ${pattern.name.substring(0, 20)}`)}`
      );
    }

    // Check cache first
    const cached = getCachedResult(pattern);
    if (cached) {
      results.push(cached);
      cachedCount++;
      continue;
    }

    try {
      // Extract claims
      const claims = await extractClaims(pattern);

      if (claims.length === 0) {
        // No claims to verify
        const emptyResult: PatternVerification = {
          patternId: pattern.id,
          patternName: pattern.name,
          timestamp: new Date().toISOString(),
          model: 'claude-code-cli',
          totalClaims: 0,
          results: [],
          summary: {
            verified: 0,
            partially: 0,
            unverified: 0,
            disputed: 0,
            fabricated: 0,
            highImportanceIssues: [],
            suggestedConfidenceImpact: 'No verifiable claims found in this pattern.',
          },
        };
        results.push(emptyResult);
        cacheResult(pattern, emptyResult);
        continue;
      }

      // Verify claims with connectivity tracking
      const verificationResult: VerifyAllClaimsResult = await verifyAllClaims(claims, {
        onConnectivityPause: (action, failures) => {
          if (options.outputFormat !== 'json') {
            console.log(`\n[Connectivity] ${failures} consecutive failures - ${action}`);
          }
        },
        onHalt: (signal) => {
          if (options.outputFormat !== 'json') {
            console.log(`\n${formatHaltReport(signal, i + 1, patterns.length)}`);
          }
        },
      });

      // Generate summary from results
      const summary = generateSummary(verificationResult.results, pattern.confidence);

      const verification: PatternVerification = {
        patternId: pattern.id,
        patternName: pattern.name,
        timestamp: new Date().toISOString(),
        model: 'claude-code-cli',
        totalClaims: claims.length,
        results: verificationResult.results,
        summary,
      };

      results.push(verification);

      // Check for halt - don't cache partial results
      if (verificationResult.halted) {
        // Save partial results without caching
        const batchSummary = generateBatchSummary(results);
        const reportPath = await saveReport(batchSummary, results, {
          customPath: options.outputFile,
          isPartial: true,
        });

        if (options.outputFormat !== 'json') {
          console.log(`\nPartial results saved to: ${reportPath}`);
          console.log(`Completed ${i + 1}/${patterns.length} patterns before halt`);
        }

        // Exit with code 2 for connectivity halt
        process.exit(2);
      }

      // Only cache complete verifications
      cacheResult(pattern, verification);

      // Rate limiting between patterns
      if (i < patterns.length - 1) {
        await delay(1000);
      }
    } catch (error) {
      console.error(`\nError verifying pattern ${pattern.id}: ${error}`);
      // Continue with next pattern
    }
  }

  // Clear progress line
  if (options.outputFormat !== 'json') {
    console.log('\n');
  }

  if (cachedCount > 0) {
    console.log(`Used ${cachedCount} cached results\n`);
  }

  // Generate batch summary
  const batchSummary = generateBatchSummary(results);

  // Save report
  const reportPath = await saveReport(batchSummary, results, {
    customPath: options.outputFile,
  });

  // Output results
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify({ summary: batchSummary, results }, null, 2));
  } else {
    // Show batch summary
    console.log(formatBatchSummary(batchSummary, results));

    // Show individual results if not summary-only
    if (!options.summaryOnly) {
      console.log('\n' + '-'.repeat(60));
      console.log('INDIVIDUAL VERIFICATIONS');
      console.log('-'.repeat(60));

      for (const result of results) {
        console.log(formatVerificationResult(result));
      }
    }

    console.log(`\nReport saved to: ${reportPath}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nCompleted in ${elapsed}s`);
}

/**
 * Load patterns from source path
 */
function loadPatterns(sourcePath: string): PatternInput[] {
  const resolvedPath = path.resolve(process.cwd(), sourcePath);

  try {
    const stat = fs.statSync(resolvedPath);

    if (stat.isFile() && resolvedPath.endsWith('.json')) {
      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      return JSON.parse(raw) as PatternInput[];
    }

    if (stat.isDirectory()) {
      const jsonPath = path.join(resolvedPath, 'patterns.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(raw) as PatternInput[];
      }
    }
  } catch (error) {
    console.error(`Error loading patterns from ${sourcePath}:`, error);
  }

  return [];
}

/**
 * Parse a quality-gate report to extract pattern verdicts
 * Handles format where "Pattern N: Name" appears followed by "VERDICT: CLEAN/CAUTION/FAIL"
 */
function parseReportVerdicts(reportPath: string): Map<number, PatternVerdict> {
  const verdicts = new Map<number, PatternVerdict>();
  const resolvedPath = path.resolve(process.cwd(), reportPath);

  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\n');

    let currentPatternId: number | null = null;

    for (const line of lines) {
      // Match pattern header: "Pattern N: Name" or "═══... Pattern N: Name"
      const patternMatch = line.match(/Pattern\s+(\d+):\s+/);
      if (patternMatch) {
        currentPatternId = parseInt(patternMatch[1], 10);
      }

      // Match verdict line: "VERDICT: CLEAN" or " VERDICT: CAUTION - ..."
      const verdictMatch = line.match(/VERDICT:\s*(CLEAN|CAUTION|FAIL)/i);
      if (verdictMatch && currentPatternId !== null) {
        const verdict = verdictMatch[1].toUpperCase() as PatternVerdict;
        verdicts.set(currentPatternId, verdict);
        currentPatternId = null; // Reset to avoid duplicate matches
      }
    }
  } catch (error) {
    console.error(`Error parsing report ${reportPath}:`, error);
  }

  return verdicts;
}

/**
 * Filter patterns based on options
 */
function filterPatterns(
  patterns: PatternInput[],
  options: BatchOptions
): PatternInput[] {
  let filtered = patterns;

  // Filter by ID list
  if (options.filterIds && options.filterIds.length > 0) {
    const idSet = new Set(options.filterIds);
    filtered = filtered.filter(p => idSet.has(p.id));
  }

  // Filter by excluding patterns with certain verdicts from previous report
  if (options.excludeVerdicts && options.previousReport) {
    const previousVerdicts = parseReportVerdicts(options.previousReport);
    const excludeSet = new Set(options.excludeVerdicts);

    filtered = filtered.filter(p => {
      const previousVerdict = previousVerdicts.get(p.id);
      if (previousVerdict && excludeSet.has(previousVerdict)) {
        return false; // Exclude this pattern
      }
      return true;
    });
  }

  return filtered;
}

/**
 * Generate batch summary statistics
 */
function generateBatchSummary(results: PatternVerification[]): BatchVerificationSummary {
  let patternsClean = 0;
  let patternsWithIssues = 0;
  let patternsWithGaps = 0;

  const claimBreakdown = {
    verified: 0,
    partially: 0,
    unverified: 0,
    disputed: 0,
    fabricated: 0,
  };

  const worstOffenders: {
    patternId: number;
    patternName: string;
    disputed: number;
    fabricated: number;
  }[] = [];

  let totalClaims = 0;

  for (const result of results) {
    totalClaims += result.totalClaims;

    // Aggregate claim verdicts
    claimBreakdown.verified += result.summary.verified;
    claimBreakdown.partially += result.summary.partially;
    claimBreakdown.unverified += result.summary.unverified;
    claimBreakdown.disputed += result.summary.disputed;
    claimBreakdown.fabricated += result.summary.fabricated;

    // Determine pattern verdict
    const verdict = determineVerdict(result.results);

    switch (verdict) {
      case 'CLEAN':
        patternsClean++;
        break;
      case 'CAUTION':
        patternsWithGaps++;
        break;
      case 'FAIL':
        patternsWithIssues++;
        worstOffenders.push({
          patternId: result.patternId,
          patternName: result.patternName,
          disputed: result.summary.disputed,
          fabricated: result.summary.fabricated,
        });
        break;
    }
  }

  // Sort worst offenders by severity
  worstOffenders.sort(
    (a, b) => b.fabricated + b.disputed - (a.fabricated + a.disputed)
  );

  return {
    total: results.length,
    patternsClean,
    patternsWithIssues,
    patternsWithGaps,
    totalClaims,
    claimBreakdown,
    worstOffenders: worstOffenders.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save report to file
 */
async function saveReport(
  summary: BatchVerificationSummary,
  results: PatternVerification[],
  options?: {
    customPath?: string;
    isPartial?: boolean;
  }
): Promise<string> {
  let filepath: string;

  if (options?.customPath) {
    // Use custom path
    filepath = path.resolve(process.cwd(), options.customPath);
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } else {
    // Ensure reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = options?.isPartial ? 'verify-partial' : 'verify';
    const filename = `${prefix}-${timestamp}.json`;
    filepath = path.join(REPORTS_DIR, filename);
  }

  // Determine format from file extension
  const isTextFormat = filepath.endsWith('.txt');

  if (isTextFormat) {
    // Write text format report
    const report = formatTextReport(summary, results, options?.isPartial);
    fs.writeFileSync(filepath, report, 'utf-8');
  } else {
    // Write JSON report
    const report = JSON.stringify({ summary, results, partial: options?.isPartial }, null, 2);
    fs.writeFileSync(filepath, report, 'utf-8');
  }

  return filepath;
}
