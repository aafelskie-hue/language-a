/**
 * Red Team Agent Batch Mode
 * Review multiple patterns with rate limiting and summary statistics
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadPatternCatalog, parsePatternFromMarkdown } from './parser.js';
import { reviewPattern } from './api.js';
import {
  formatBatchSummary,
  formatReviewResult,
  formatBatchAsJson,
  formatProgress,
} from './formatter.js';
import type { PatternInput, ReviewResult, BatchSummary } from './types.js';

interface BatchOptions {
  strict?: boolean;
  outputFormat?: 'terminal' | 'json';
  summaryOnly?: boolean;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run batch review of patterns
 */
export async function runBatchReview(
  sourcePath: string,
  options: BatchOptions = {}
): Promise<void> {
  const patterns = await loadPatterns(sourcePath);

  if (patterns.length === 0) {
    console.error('No patterns found to review');
    return;
  }

  console.log(`Starting batch review of ${patterns.length} patterns...`);
  console.log('');

  const results: ReviewResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];

    // Progress indicator
    if (options.outputFormat !== 'json') {
      process.stdout.write(`\r${formatProgress(i + 1, patterns.length, pattern.name)}`);
    }

    try {
      const result = await reviewPattern(pattern, { strict: options.strict });
      results.push(result);

      // Rate limiting: 1-second delay between API calls
      if (i < patterns.length - 1) {
        await delay(1000);
      }
    } catch (error) {
      console.error(`\nError reviewing pattern ${pattern.id}: ${error}`);
      // Continue with next pattern
    }
  }

  // Clear progress line
  if (options.outputFormat !== 'json') {
    console.log('\n');
  }

  // Generate summary
  const summary = generateSummary(results);

  // Save report
  const reportPath = await saveReport(summary, results);

  // Output results
  if (options.outputFormat === 'json') {
    console.log(formatBatchAsJson(summary, results));
  } else {
    // Show summary
    console.log(formatBatchSummary(summary));

    // Show individual results if not summary-only
    if (!options.summaryOnly) {
      console.log('\n' + '─'.repeat(60));
      console.log('INDIVIDUAL REVIEWS');
      console.log('─'.repeat(60));

      for (const result of results) {
        console.log(formatReviewResult(result));
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
async function loadPatterns(sourcePath: string): Promise<PatternInput[]> {
  const resolvedPath = path.resolve(process.cwd(), sourcePath);
  const stat = fs.statSync(resolvedPath);

  if (stat.isFile()) {
    // JSON file
    if (resolvedPath.endsWith('.json')) {
      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      return JSON.parse(raw) as PatternInput[];
    }
    // Single markdown file
    if (resolvedPath.endsWith('.md')) {
      const pattern = parsePatternFromMarkdown(resolvedPath);
      return pattern ? [pattern] : [];
    }
  }

  if (stat.isDirectory()) {
    // Directory with markdown files
    const files = fs.readdirSync(resolvedPath).filter((f) => f.endsWith('.md'));
    const patterns: PatternInput[] = [];

    for (const file of files) {
      const pattern = parsePatternFromMarkdown(path.join(resolvedPath, file));
      if (pattern) patterns.push(pattern);
    }

    // If no markdown files, look for patterns.json
    if (patterns.length === 0) {
      const jsonPath = path.join(resolvedPath, 'patterns.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(raw) as PatternInput[];
      }
    }

    return patterns;
  }

  // Default: load from standard catalog
  return loadPatternCatalog();
}

/**
 * Generate summary statistics from results
 */
function generateSummary(results: ReviewResult[]): BatchSummary {
  const summary: BatchSummary = {
    totalPatterns: results.length,
    reviewed: results.length,
    publishReady: 0,
    needsRevision: 0,
    needsRethink: 0,
    averageScore: 0,
    byScale: {
      neighborhood: { count: 0, avgScore: 0 },
      building: { count: 0, avgScore: 0 },
      construction: { count: 0, avgScore: 0 },
    },
    commonIssues: [],
    timestamp: new Date().toISOString(),
  };

  // Count verdicts
  let totalScore = 0;
  const scaleScores: Record<string, number[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };

  // Track issues by dimension
  const issueCount: Record<string, number> = {};

  for (const result of results) {
    totalScore += result.overallScore;

    switch (result.verdict) {
      case 'PUBLISH':
        summary.publishReady++;
        break;
      case 'REVISE':
        summary.needsRevision++;
        break;
      case 'RETHINK':
        summary.needsRethink++;
        break;
    }

    // Track issues from failed or needs-work dimensions
    for (const dim of result.dimensions) {
      if (dim.score === 'Fail' || dim.score === 'Needs Work') {
        const issueKey = `${dim.dimension}: ${dim.score}`;
        issueCount[issueKey] = (issueCount[issueKey] || 0) + 1;
      }
    }
  }

  // Calculate averages
  summary.averageScore = results.length > 0 ? totalScore / results.length : 0;

  // Sort and compile common issues
  summary.commonIssues = Object.entries(issueCount)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return summary;
}

/**
 * Save report to file
 */
async function saveReport(summary: BatchSummary, results: ReviewResult[]): Promise<string> {
  const reportsDir = path.resolve(process.cwd(), 'tools/red-team/reports');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `review-${timestamp}.json`;
  const filepath = path.join(reportsDir, filename);

  // Write report
  const report = JSON.stringify({ summary, results }, null, 2);
  fs.writeFileSync(filepath, report, 'utf-8');

  return filepath;
}
