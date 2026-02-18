/**
 * Research Verification Agent Formatter
 * Terminal output formatting with chalk
 */

import chalk from 'chalk';
import type {
  PatternVerification,
  VerificationResult,
  VerificationSummary,
  VerificationVerdict,
  PatternVerdict,
  BatchVerificationSummary,
  ExtractedClaim,
  Confidence,
  BatchHaltSignal,
} from './types.js';

/**
 * Format verification result for terminal output
 */
export function formatVerificationResult(result: PatternVerification): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold('='.repeat(60)));
  lines.push(chalk.bold(`RESEARCH VERIFICATION - ${result.patternId}. ${result.patternName}`));
  lines.push(chalk.bold('='.repeat(60)));
  lines.push('');

  lines.push(`Claims extracted: ${result.totalClaims}`);
  lines.push('');

  // Results section
  lines.push(chalk.bold('--- RESULTS ' + '-'.repeat(47)));
  lines.push('');

  for (const r of result.results) {
    lines.push(formatClaimResult(r));
    lines.push('');
  }

  // Summary section
  lines.push(chalk.bold('--- SUMMARY ' + '-'.repeat(47)));
  lines.push('');

  lines.push(formatSummaryBars(result.summary, result.totalClaims));
  lines.push('');

  // High importance issues
  if (result.summary.highImportanceIssues.length > 0) {
    lines.push(chalk.bold.yellow('  HIGH-IMPORTANCE ISSUES:'));
    for (const issue of result.summary.highImportanceIssues) {
      lines.push(chalk.yellow(`  !! ${issue.verdict}: ${issue.claim.claim.substring(0, 50)}...`));
    }
  } else {
    lines.push(chalk.green('  HIGH-IMPORTANCE ISSUES: None'));
  }
  lines.push('');

  // Confidence impact
  lines.push(chalk.bold('  CONFIDENCE IMPACT:'));
  const wrappedImpact = wrapText(result.summary.suggestedConfidenceImpact, 50);
  for (const line of wrappedImpact) {
    lines.push(`  ${line}`);
  }
  lines.push('');

  // Verdict
  const verdict = determineVerdict(result.results);
  const verdictLine = formatVerdictBanner(verdict, result.results);
  lines.push(chalk.bold('='.repeat(60)));
  lines.push(verdictLine);
  lines.push(chalk.bold('='.repeat(60)));

  return lines.join('\n');
}

/**
 * Format a single claim result
 */
function formatClaimResult(result: VerificationResult): string {
  const icon = getVerdictIcon(result.verdict);
  const color = getVerdictColor(result.verdict);
  const isHighImportance =
    result.claim.importance === 'high' &&
    (result.verdict === 'DISPUTED' || result.verdict === 'FABRICATED');

  const lines: string[] = [];

  // Main verdict line
  const claimText =
    result.claim.claim.length > 60
      ? result.claim.claim.substring(0, 57) + '...'
      : result.claim.claim;
  lines.push(color(`${icon} ${result.verdict.padEnd(10)} "${claimText}"`));

  // Summary
  const wrappedSummary = wrapText(result.summary, 52);
  for (const line of wrappedSummary) {
    lines.push(chalk.gray(`             ${line}`));
  }

  // Source if available
  if (result.sources.length > 0) {
    lines.push(chalk.dim(`             Source: ${result.sources[0]}`));
  }

  // High importance warning
  if (isHighImportance) {
    lines.push(chalk.yellow.bold(`             !! HIGH IMPORTANCE - pattern's argument depends on this`));
  }

  return lines.join('\n');
}

/**
 * Get icon for verdict
 */
function getVerdictIcon(verdict: VerificationVerdict): string {
  switch (verdict) {
    case 'VERIFIED':
      return '\u2713'; // checkmark
    case 'PARTIALLY':
      return '~';
    case 'UNVERIFIED':
      return '?';
    case 'DISPUTED':
      return '\u2717'; // x
    case 'FABRICATED':
      return '\u2717'; // x
  }
}

/**
 * Get color for verdict
 */
function getVerdictColor(verdict: VerificationVerdict): (text: string) => string {
  switch (verdict) {
    case 'VERIFIED':
      return chalk.green;
    case 'PARTIALLY':
      return chalk.yellow;
    case 'UNVERIFIED':
      return chalk.gray;
    case 'DISPUTED':
      return chalk.red;
    case 'FABRICATED':
      return chalk.red.bold;
  }
}

/**
 * Format summary statistics with progress bars
 */
function formatSummaryBars(summary: VerificationSummary, total: number): string {
  const lines: string[] = [];

  const items: Array<{ label: string; count: number; color: (t: string) => string }> = [
    { label: 'VERIFIED', count: summary.verified, color: chalk.green },
    { label: 'PARTIALLY', count: summary.partially, color: chalk.yellow },
    { label: 'UNVERIFIED', count: summary.unverified, color: chalk.gray },
    { label: 'DISPUTED', count: summary.disputed, color: chalk.red },
    { label: 'FABRICATED', count: summary.fabricated, color: chalk.red.bold },
  ];

  for (const item of items) {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    const bar = item.color('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
    lines.push(`  ${item.label.padEnd(12)} ${item.count}  ${bar}  ${percentage.toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Determine overall pattern verdict
 */
export function determineVerdict(results: VerificationResult[]): PatternVerdict {
  const hasFabricated = results.some((r) => r.verdict === 'FABRICATED');
  const hasDisputed = results.some((r) => r.verdict === 'DISPUTED');
  const hasHighImportanceIssue = results.some(
    (r) =>
      r.claim.importance === 'high' &&
      (r.verdict === 'UNVERIFIED' || r.verdict === 'DISPUTED' || r.verdict === 'FABRICATED')
  );

  if (hasFabricated || hasDisputed) return 'FAIL';
  if (hasHighImportanceIssue) return 'CAUTION';
  return 'CLEAN';
}

/**
 * Format verdict banner
 */
function formatVerdictBanner(verdict: PatternVerdict, results: VerificationResult[]): string {
  const disputed = results.filter((r) => r.verdict === 'DISPUTED').length;
  const fabricated = results.filter((r) => r.verdict === 'FABRICATED').length;

  switch (verdict) {
    case 'CLEAN':
      return chalk.bgGreen.black.bold(' VERDICT: CLEAN - pattern evidence is authentic ');
    case 'CAUTION':
      return chalk.bgYellow.black.bold(
        ' VERDICT: CAUTION - high-importance claims unverifiable '
      );
    case 'FAIL':
      return chalk.bgRed.white.bold(
        ` VERDICT: FAIL - ${fabricated} fabricated, ${disputed} disputed `
      );
  }
}

/**
 * Generate summary for pattern verification
 */
export function generateSummary(
  results: VerificationResult[],
  currentConfidence: Confidence
): VerificationSummary {
  const verified = results.filter((r) => r.verdict === 'VERIFIED').length;
  const partially = results.filter((r) => r.verdict === 'PARTIALLY').length;
  const unverified = results.filter((r) => r.verdict === 'UNVERIFIED').length;
  const disputed = results.filter((r) => r.verdict === 'DISPUTED').length;
  const fabricated = results.filter((r) => r.verdict === 'FABRICATED').length;

  const highImportanceIssues = results.filter(
    (r) =>
      r.claim.importance === 'high' &&
      r.verdict !== 'VERIFIED' &&
      r.verdict !== 'PARTIALLY'
  );

  const suggestedConfidenceImpact = assessConfidenceImpact(currentConfidence, results);

  return {
    verified,
    partially,
    unverified,
    disputed,
    fabricated,
    highImportanceIssues,
    suggestedConfidenceImpact,
  };
}

/**
 * Assess impact on confidence rating
 */
function assessConfidenceImpact(currentConfidence: Confidence, results: VerificationResult[]): string {
  const total = results.length;
  if (total === 0) {
    return 'No verifiable claims found in this pattern.';
  }

  const verified = results.filter((r) => r.verdict === 'VERIFIED').length;
  const partially = results.filter((r) => r.verdict === 'PARTIALLY').length;
  const verifiedRate = (verified + partially * 0.5) / total;

  // High-importance claims carry more weight
  const highImportance = results.filter((r) => r.claim.importance === 'high');
  const highVerified = highImportance.filter(
    (r) => r.verdict === 'VERIFIED' || r.verdict === 'PARTIALLY'
  ).length;
  const highTotal = highImportance.length;

  // Check for fabricated/disputed
  const hasFabricated = results.some((r) => r.verdict === 'FABRICATED');
  const hasDisputed = results.some((r) => r.verdict === 'DISPUTED');

  if (hasFabricated) {
    return `Pattern cannot hold any confidence rating until fabricated evidence is replaced. Current ${starRating(currentConfidence)} is not supportable.`;
  }

  if (hasDisputed) {
    return `Disputed claims undermine confidence. Current ${starRating(currentConfidence)} should be reviewed and potentially downgraded.`;
  }

  // Suggested confidence based on evidence quality
  let suggested: Confidence;
  if (highTotal === 0) {
    suggested = 0; // No verifiable high-importance claims - speculative
  } else if (highVerified === highTotal && verifiedRate >= 0.7) {
    suggested = 2; // All high-importance claims check out, most others too
  } else if (highVerified >= highTotal * 0.5 && verifiedRate >= 0.5) {
    suggested = 1; // Most high-importance claims hold, acceptable gaps
  } else {
    suggested = 0; // Too many gaps
  }

  // Generate human-readable assessment
  if (suggested > currentConfidence) {
    return `Evidence is stronger than current ${starRating(currentConfidence)} suggests. Consider upgrading to ${starRating(suggested)}.`;
  } else if (suggested < currentConfidence) {
    return `Evidence does not support current ${starRating(currentConfidence)}. Recommend downgrading to ${starRating(suggested)} until additional sources are found.`;
  } else {
    return `Current ${starRating(currentConfidence)} is supported by the evidence.`;
  }
}

/**
 * Format confidence as star rating
 */
function starRating(confidence: Confidence): string {
  return '\u2605'.repeat(confidence) + '\u2606'.repeat(2 - confidence);
}

/**
 * Format batch summary
 */
export function formatBatchSummary(
  summary: BatchVerificationSummary,
  patternResults: PatternVerification[]
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('='.repeat(60)));
  lines.push(chalk.bold(`BATCH VERIFICATION - ${summary.total} patterns, ${summary.totalClaims} claims`));
  lines.push(chalk.bold('='.repeat(60)));
  lines.push('');

  // Pattern verdicts
  lines.push(chalk.bold.underline('PATTERN VERDICTS:'));
  lines.push(formatPercentBar('CLEAN', summary.patternsClean, summary.total, chalk.green));
  lines.push(formatPercentBar('CAUTION', summary.patternsWithGaps, summary.total, chalk.yellow));
  lines.push(formatPercentBar('FAIL', summary.patternsWithIssues, summary.total, chalk.red));
  lines.push('');

  // Claim verdicts
  lines.push(chalk.bold.underline('CLAIM VERDICTS:'));
  const b = summary.claimBreakdown;
  const claimTotal = summary.totalClaims;
  lines.push(formatPercentBar('VERIFIED', b.verified, claimTotal, chalk.green));
  lines.push(formatPercentBar('PARTIALLY', b.partially, claimTotal, chalk.yellow));
  lines.push(formatPercentBar('UNVERIFIED', b.unverified, claimTotal, chalk.gray));
  lines.push(formatPercentBar('DISPUTED', b.disputed, claimTotal, chalk.red));
  lines.push(formatPercentBar('FABRICATED', b.fabricated, claimTotal, chalk.red.bold));
  lines.push('');

  // Worst offenders
  if (summary.worstOffenders.length > 0) {
    lines.push(chalk.bold.underline('PATTERNS REQUIRING ATTENTION:'));
    for (const p of summary.worstOffenders) {
      const issues: string[] = [];
      if (p.fabricated > 0) issues.push(`${p.fabricated} fabricated`);
      if (p.disputed > 0) issues.push(`${p.disputed} disputed`);
      lines.push(chalk.red(`  !! #${p.patternId}  ${p.patternName.padEnd(30)} - ${issues.join(', ')}`));
    }
    lines.push('');
  }

  // Most reliable
  const reliable = patternResults
    .filter((p) => determineVerdict(p.results) === 'CLEAN')
    .sort(
      (a, b) =>
        b.summary.verified / b.totalClaims - a.summary.verified / a.totalClaims
    )
    .slice(0, 5);

  if (reliable.length > 0) {
    lines.push(chalk.bold.underline('MOST RELIABLE PATTERNS:'));
    for (const p of reliable) {
      const rate = Math.round((p.summary.verified / p.totalClaims) * 100);
      lines.push(chalk.green(`  #${p.patternId}  ${p.patternName.padEnd(30)} - ${rate}% verified`));
    }
    lines.push('');
  }

  lines.push(chalk.bold('='.repeat(60)));
  lines.push(chalk.gray(`Generated: ${summary.timestamp}`));
  lines.push(chalk.bold('='.repeat(60)));

  return lines.join('\n');
}

/**
 * Format percentage bar
 */
function formatPercentBar(
  label: string,
  count: number,
  total: number,
  color: (text: string) => string
): string {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const barLength = 30;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;

  const bar = color('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
  return `  ${label.padEnd(12)} ${bar} ${count} (${percentage.toFixed(0)}%)`;
}

/**
 * Format progress indicator
 */
export function formatProgress(current: number, total: number, action: string): string {
  const percentage = Math.round((current / total) * 100);
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  const bar = chalk.cyan('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));

  return `${action}... ${bar} ${current}/${total}`;
}

/**
 * Format extracted claims for preview
 */
export function formatExtractedClaims(claims: ExtractedClaim[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('EXTRACTED CLAIMS'));
  lines.push(chalk.bold('-'.repeat(60)));
  lines.push('');

  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    const importance = c.importance === 'high' ? chalk.yellow('[HIGH]') : chalk.gray('[low]');
    lines.push(`${(i + 1).toString().padStart(2)}. ${chalk.cyan(`[${c.type}]`)} ${importance}`);
    lines.push(`    ${c.claim}`);
    lines.push(chalk.dim(`    "${c.text.substring(0, 70)}..."`));
    lines.push('');
  }

  lines.push(`Total: ${claims.length} claims`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format result as JSON
 */
export function formatAsJson(result: PatternVerification): string {
  return JSON.stringify(result, null, 2);
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
 * Strip ANSI color codes from text
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Format halt report for connectivity issues
 */
export function formatHaltReport(
  signal: { reason: string; completedCount: number; totalCount: number; consecutiveFailures: number },
  patternsCompleted: number,
  patternsTotal: number
): string {
  const lines: string[] = [];

  lines.push(chalk.bgRed.white.bold(' BATCH HALTED - CONNECTIVITY ISSUE '));
  lines.push('');
  lines.push(chalk.red(`Reason: ${signal.reason}`));
  lines.push(`Consecutive failures: ${signal.consecutiveFailures}`);
  lines.push(`Claims completed: ${signal.completedCount}/${signal.totalCount}`);
  lines.push(`Patterns completed: ${patternsCompleted}/${patternsTotal}`);
  lines.push('');
  lines.push(chalk.yellow('Web search appears unavailable. Resume verification later.'));
  lines.push(chalk.yellow('Partial results will be saved (not cached).'));
  lines.push('');
  lines.push(chalk.dim('Exit code: 2 (connectivity halt)'));

  return lines.join('\n');
}

/**
 * Format text report (for .txt output files)
 */
export function formatTextReport(
  summary: BatchVerificationSummary,
  results: PatternVerification[],
  isPartial?: boolean
): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  if (isPartial) {
    lines.push('PARTIAL RESEARCH VERIFICATION REPORT');
    lines.push('(Halted due to connectivity issues)');
  } else {
    lines.push('RESEARCH VERIFICATION REPORT');
  }
  lines.push(`Generated: ${summary.timestamp}`);
  lines.push('='.repeat(60));
  lines.push('');

  // Summary section
  lines.push('SUMMARY');
  lines.push('-'.repeat(40));
  lines.push(`Total patterns: ${summary.total}`);
  lines.push(`Total claims: ${summary.totalClaims}`);
  lines.push('');

  // Pattern verdicts
  lines.push('PATTERN VERDICTS:');
  lines.push(`  CLEAN:   ${summary.patternsClean} (${pct(summary.patternsClean, summary.total)}%)`);
  lines.push(`  CAUTION: ${summary.patternsWithGaps} (${pct(summary.patternsWithGaps, summary.total)}%)`);
  lines.push(`  FAIL:    ${summary.patternsWithIssues} (${pct(summary.patternsWithIssues, summary.total)}%)`);
  lines.push('');

  // Claim verdicts
  lines.push('CLAIM VERDICTS:');
  const b = summary.claimBreakdown;
  const t = summary.totalClaims;
  lines.push(`  VERIFIED:   ${b.verified} (${pct(b.verified, t)}%)`);
  lines.push(`  PARTIALLY:  ${b.partially} (${pct(b.partially, t)}%)`);
  lines.push(`  UNVERIFIED: ${b.unverified} (${pct(b.unverified, t)}%)`);
  lines.push(`  DISPUTED:   ${b.disputed} (${pct(b.disputed, t)}%)`);
  lines.push(`  FABRICATED: ${b.fabricated} (${pct(b.fabricated, t)}%)`);
  lines.push('');

  // Individual pattern results
  lines.push('='.repeat(60));
  lines.push('INDIVIDUAL PATTERN RESULTS');
  lines.push('='.repeat(60));
  lines.push('');

  for (const result of results) {
    const verdict = determineVerdict(result.results);
    lines.push(`Pattern ${result.patternId}: ${result.patternName} [RV: ${verdict}]`);
    lines.push(`  Claims: ${result.totalClaims}`);
    lines.push(`  Verified: ${result.summary.verified}, Partially: ${result.summary.partially}`);
    lines.push(`  Unverified: ${result.summary.unverified}, Disputed: ${result.summary.disputed}, Fabricated: ${result.summary.fabricated}`);

    // Show high importance issues
    if (result.summary.highImportanceIssues.length > 0) {
      lines.push('  HIGH IMPORTANCE ISSUES:');
      for (const issue of result.summary.highImportanceIssues) {
        lines.push(`    - ${issue.verdict}: ${issue.claim.claim.substring(0, 60)}...`);
      }
    }
    lines.push('');
  }

  // Worst offenders
  if (summary.worstOffenders.length > 0) {
    lines.push('='.repeat(60));
    lines.push('PATTERNS REQUIRING ATTENTION');
    lines.push('='.repeat(60));
    for (const p of summary.worstOffenders) {
      const issues: string[] = [];
      if (p.fabricated > 0) issues.push(`${p.fabricated} fabricated`);
      if (p.disputed > 0) issues.push(`${p.disputed} disputed`);
      lines.push(`  #${p.patternId} ${p.patternName} - ${issues.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format comparison summary showing previous -> new verdicts
 */
export function formatComparisonSummary(
  previousResults: Map<number, PatternVerdict>,
  newResults: PatternVerification[]
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('='.repeat(70)));
  lines.push(chalk.bold('VERDICT COMPARISON: Previous -> New'));
  lines.push(chalk.bold('='.repeat(70)));
  lines.push('');

  // Table header
  lines.push(`${'Pattern ID'.padEnd(12)}| ${'Name'.padEnd(30)}| ${'Previous'.padEnd(10)}| New`);
  lines.push('-'.repeat(70));

  let improved = 0;
  let unchanged = 0;
  let regressed = 0;

  for (const result of newResults) {
    const newVerdict = determineVerdict(result.results);
    const prevVerdict = previousResults.get(result.patternId);

    if (!prevVerdict) continue; // Skip if no previous verdict

    const name = result.patternName.length > 28
      ? result.patternName.substring(0, 25) + '...'
      : result.patternName;

    let changeIndicator = '';
    if (prevVerdict === newVerdict) {
      unchanged++;
      changeIndicator = chalk.gray('=');
    } else if (
      (prevVerdict === 'FAIL' && (newVerdict === 'CAUTION' || newVerdict === 'CLEAN')) ||
      (prevVerdict === 'CAUTION' && newVerdict === 'CLEAN')
    ) {
      improved++;
      changeIndicator = chalk.green('^');
    } else {
      regressed++;
      changeIndicator = chalk.red('v');
    }

    const prevColor = getVerdictColorFn(prevVerdict);
    const newColor = getVerdictColorFn(newVerdict);

    lines.push(
      `${String(result.patternId).padEnd(12)}| ${name.padEnd(30)}| ${prevColor(prevVerdict.padEnd(10))}| ${newColor(newVerdict)} ${changeIndicator}`
    );
  }

  lines.push('-'.repeat(70));
  lines.push('');
  lines.push(chalk.bold('SUMMARY:'));
  lines.push(chalk.green(`  Improved: ${improved}`));
  lines.push(chalk.gray(`  Unchanged: ${unchanged}`));
  lines.push(chalk.red(`  Regressed: ${regressed}`));
  lines.push('');

  return lines.join('\n');
}

/**
 * Get color function for verdict
 */
function getVerdictColorFn(verdict: PatternVerdict): (text: string) => string {
  switch (verdict) {
    case 'CLEAN':
      return chalk.green;
    case 'CAUTION':
      return chalk.yellow;
    case 'FAIL':
      return chalk.red;
  }
}

/**
 * Calculate percentage
 */
function pct(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(0) : '0';
}
