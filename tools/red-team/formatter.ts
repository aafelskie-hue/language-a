/**
 * Red Team Agent Formatter
 * Terminal output formatting with chalk
 */

import chalk from 'chalk';
import type { ReviewResult, BatchSummary, DimensionScore, Verdict } from './types.js';

/**
 * Format a single review result for terminal output
 */
export function formatReviewResult(result: ReviewResult): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold(`Pattern ${result.patternId}: ${result.patternName}`));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Verdict banner
  const verdictColor = getVerdictColor(result.verdict);
  const verdictBanner = ` ${result.verdict} `;
  lines.push(verdictColor(chalk.bold(`  ████ ${verdictBanner} ████  `)));
  lines.push('');

  // Overall score bar
  lines.push(formatScoreBar('Overall Score', result.overallScore, 10));
  lines.push('');

  // Dimension scores
  lines.push(chalk.bold.underline('Dimension Scores:'));
  lines.push('');

  for (const dim of result.dimensions) {
    lines.push(formatDimensionRow(dim.dimension, dim.score));
    if (dim.reasoning) {
      const wrappedReasoning = wrapText(dim.reasoning, 56);
      for (const line of wrappedReasoning) {
        lines.push(chalk.gray(`    ${line}`));
      }
    }
    if (dim.suggestions && dim.suggestions.length > 0) {
      lines.push(chalk.yellow('    Suggestions:'));
      for (const suggestion of dim.suggestions) {
        lines.push(chalk.yellow(`      • ${suggestion}`));
      }
    }
    lines.push('');
  }

  // Critical issues
  if (result.criticalIssues && result.criticalIssues.length > 0) {
    lines.push(chalk.bold.red('Critical Issues:'));
    for (const issue of result.criticalIssues) {
      lines.push(chalk.red(`  ⚠ ${issue}`));
    }
    lines.push('');
  }

  // Overlapping patterns
  if (result.overlappingPatterns && result.overlappingPatterns.length > 0) {
    lines.push(chalk.bold.yellow('Potential Overlaps:'));
    lines.push(chalk.yellow(`  Patterns: ${result.overlappingPatterns.join(', ')}`));
    lines.push('');
  }

  // Summary
  lines.push(chalk.bold.underline('Summary:'));
  const wrappedSummary = wrapText(result.summary, 58);
  for (const line of wrappedSummary) {
    lines.push(`  ${line}`);
  }
  lines.push('');

  // Footer
  lines.push(chalk.gray(`Reviewed: ${result.timestamp}`));
  lines.push(chalk.bold('─'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format a score bar visualization
 */
function formatScoreBar(label: string, score: number, max: number): string {
  const percentage = score / max;
  const barLength = 20;
  const filled = Math.round(percentage * barLength);
  const empty = barLength - filled;

  const color = percentage >= 0.7 ? chalk.green : percentage >= 0.5 ? chalk.yellow : chalk.red;
  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

  return `  ${label.padEnd(15)} ${bar} ${score.toFixed(1)}/${max}`;
}

/**
 * Format a dimension row with score indicator
 */
function formatDimensionRow(dimension: string, score: DimensionScore): string {
  const scoreColor = getScoreColor(score);
  const icon = score === 'Pass' ? '✓' : score === 'Needs Work' ? '○' : '✗';
  return `  ${scoreColor(icon)} ${dimension.padEnd(28)} ${scoreColor(score)}`;
}

/**
 * Get chalk color for score
 */
function getScoreColor(score: DimensionScore): (text: string) => string {
  switch (score) {
    case 'Pass':
      return chalk.green;
    case 'Needs Work':
      return chalk.yellow;
    case 'Fail':
      return chalk.red;
  }
}

/**
 * Get chalk color for verdict
 */
function getVerdictColor(verdict: Verdict): (text: string) => string {
  switch (verdict) {
    case 'PUBLISH':
      return chalk.bgGreen.black;
    case 'REVISE':
      return chalk.bgYellow.black;
    case 'RETHINK':
      return chalk.bgRed.white;
  }
}

/**
 * Format batch summary for terminal output
 */
export function formatBatchSummary(summary: BatchSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold('           BATCH REVIEW SUMMARY'));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Overall stats
  lines.push(chalk.bold.underline('Overview:'));
  lines.push(`  Total Patterns:    ${summary.totalPatterns}`);
  lines.push(`  Reviewed:          ${summary.reviewed}`);
  lines.push(`  Average Score:     ${summary.averageScore.toFixed(1)}/10`);
  lines.push('');

  // Verdict breakdown with bars
  lines.push(chalk.bold.underline('Verdicts:'));
  const publishPct = (summary.publishReady / summary.reviewed) * 100;
  const revisePct = (summary.needsRevision / summary.reviewed) * 100;
  const rethinkPct = (summary.needsRethink / summary.reviewed) * 100;

  lines.push(formatPercentBar('PUBLISH', summary.publishReady, summary.reviewed, chalk.green));
  lines.push(formatPercentBar('REVISE', summary.needsRevision, summary.reviewed, chalk.yellow));
  lines.push(formatPercentBar('RETHINK', summary.needsRethink, summary.reviewed, chalk.red));
  lines.push('');

  // By scale
  lines.push(chalk.bold.underline('By Scale:'));
  for (const [scale, data] of Object.entries(summary.byScale)) {
    if (data.count > 0) {
      lines.push(`  ${scale.padEnd(15)} ${data.count} patterns, avg ${data.avgScore.toFixed(1)}/10`);
    }
  }
  lines.push('');

  // Common issues
  if (summary.commonIssues.length > 0) {
    lines.push(chalk.bold.underline('Common Issues:'));
    for (const issue of summary.commonIssues.slice(0, 5)) {
      lines.push(`  ${issue.count}x  ${issue.issue}`);
    }
    lines.push('');
  }

  // Footer
  lines.push(chalk.gray(`Generated: ${summary.timestamp}`));
  lines.push(chalk.bold('═'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format a percentage bar
 */
function formatPercentBar(
  label: string,
  count: number,
  total: number,
  color: (text: string) => string
): string {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `  ${label.padEnd(10)} ${bar} ${count} (${percentage.toFixed(0)}%)`;
}

/**
 * Wrap text to specified width
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Format progress indicator for batch processing
 */
export function formatProgress(current: number, total: number, patternName: string): string {
  const percentage = Math.round((current / total) * 100);
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

  return `${bar} ${current}/${total} (${percentage}%) - ${patternName}`;
}

/**
 * Format review result as JSON
 */
export function formatAsJson(result: ReviewResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Format batch summary as JSON
 */
export function formatBatchAsJson(summary: BatchSummary, results: ReviewResult[]): string {
  return JSON.stringify({ summary, results }, null, 2);
}
