#!/usr/bin/env npx tsx
/**
 * Quality Gate CLI
 * Runs Red Team + Research Verification in sequence using Claude Code CLI
 *
 * Exit codes:
 *   0 - Both pass
 *   1 - Red Team fails (RETHINK verdict)
 *   2 - Research fails (FAIL verdict)
 *   3 - Both fail
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

// Red Team imports
import { reviewPattern } from './red-team/api.js';
import { loadPatternCatalog, parsePatternFromJson } from './red-team/parser.js';
import { formatReviewResult } from './red-team/formatter.js';
import type { ReviewResult, Verdict } from './red-team/types.js';

// Research Verify imports
import { extractClaims } from './research-verify/extractor.js';
import { verifyAllClaims } from './research-verify/checker.js';
import {
  formatVerificationResult,
  generateSummary,
  determineVerdict,
  formatProgress,
} from './research-verify/formatter.js';
import type {
  PatternInput,
  PatternVerification,
  PatternVerdict,
} from './research-verify/types.js';

// CLI utility
import { delay } from './lib/claude-cli.js';

interface QualityGateOptions {
  id?: number;
  draft?: string;
  batch?: string;
  strict?: boolean;
  summary?: boolean;
}

/**
 * Parse a draft markdown file into PatternInput
 */
function parseDraftFile(draftPath: string): PatternInput | null {
  if (!fs.existsSync(draftPath)) {
    return null;
  }

  const content = fs.readFileSync(draftPath, 'utf-8');

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length).trim();

  // Parse frontmatter fields
  const getId = (fm: string): number => {
    const m = fm.match(/^id:\s*(\d+)/m);
    return m ? parseInt(m[1], 10) : 0;
  };

  const getString = (fm: string, field: string): string => {
    const m = fm.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?`, 'm'));
    return m ? m[1].trim() : '';
  };

  const getNumber = (fm: string, field: string): number => {
    const m = fm.match(new RegExp(`^${field}:\\s*(\\d+)`, 'm'));
    return m ? parseInt(m[1], 10) : 0;
  };

  const getArray = (fm: string, field: string): number[] => {
    const m = fm.match(new RegExp(`^${field}:\\s*\\[([^\\]]+)\\]`, 'm'));
    if (!m) return [];
    return m[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  };

  // Extract problem and solution from body
  const boldSections = body.match(/\*\*([^*]+)\*\*/g) || [];
  let problem = '';
  let solution = '';

  for (const section of boldSections) {
    const text = section.replace(/\*\*/g, '').trim();
    if (text.toLowerCase().startsWith('therefore:')) {
      solution = text;
    } else if (text.length > 50 && !text.startsWith('…')) {
      problem = text;
    }
  }

  // Extract body text (evidence paragraphs)
  const bodyText = body
    .replace(/^#.*$/gm, '')  // Remove headers
    .replace(/\*\*[^*]+\*\*/g, '')  // Remove bold sections
    .replace(/---[\s\S]*?---/, '')  // Remove frontmatter if duplicated
    .trim();

  return {
    id: getId(frontmatter),
    name: getString(frontmatter, 'name'),
    number: String(getId(frontmatter)).padStart(2, '0'),
    scale: getString(frontmatter, 'scale') as 'neighborhood' | 'building' | 'construction',
    category: getString(frontmatter, 'category'),
    categoryLabel: getString(frontmatter, 'categoryLabel'),
    confidence: getNumber(frontmatter, 'confidence') as 0 | 1 | 2,
    status: 'candidate',
    problem,
    body: bodyText,
    solution,
    connections_up: getArray(frontmatter, 'connections_up'),
    connections_down: getArray(frontmatter, 'connections_down'),
    tags: [],
  };
}

interface PatternQualityResult {
  patternId: number;
  patternName: string;
  redTeam: {
    verdict: Verdict;
    score: number;
    passed: boolean;
  };
  research: {
    verdict: PatternVerdict;
    totalClaims: number;
    verified: number;
    passed: boolean;
  };
  overallPassed: boolean;
}

/**
 * Run quality gate on a single pattern
 */
async function runQualityGate(
  pattern: PatternInput,
  options: { strict?: boolean; verbose?: boolean } = {}
): Promise<{ review: ReviewResult; verification: PatternVerification; result: PatternQualityResult }> {
  const verbose = options.verbose ?? true;

  // Step 1: Red Team Review
  if (verbose) {
    console.log(chalk.bold(`\n[1/2] Red Team Review...`));
  }

  const review = await reviewPattern(pattern, { strict: options.strict });

  if (verbose) {
    console.log(formatReviewResult(review));
  }

  // Brief pause between tools
  await delay(2000);

  // Step 2: Research Verification
  if (verbose) {
    console.log(chalk.bold(`\n[2/2] Research Verification...`));
    process.stdout.write('Extracting claims...');
  }

  const claims = await extractClaims(pattern);

  if (verbose) {
    console.log(` found ${claims.length} claims`);
  }

  let verificationResults: PatternVerification['results'] = [];
  let researchVerdict: PatternVerdict = 'CLEAN';

  if (claims.length > 0) {
    const verifyResult = await verifyAllClaims(claims, {
      onProgress: (current, total) => {
        if (verbose) {
          process.stdout.write(`\r${formatProgress(current, total, 'Verifying')}`);
        }
      },
    });
    verificationResults = verifyResult.results;

    if (verbose) {
      console.log('');
    }

    researchVerdict = determineVerdict(verificationResults);
  }

  const summary = generateSummary(verificationResults, pattern.confidence);

  const verification: PatternVerification = {
    patternId: pattern.id,
    patternName: pattern.name,
    timestamp: new Date().toISOString(),
    model: 'claude-code-cli',
    totalClaims: claims.length,
    results: verificationResults,
    summary,
  };

  if (verbose) {
    console.log(formatVerificationResult(verification));
  }

  // Determine pass/fail
  const redTeamPassed = review.verdict !== 'RETHINK';
  const researchPassed = researchVerdict !== 'FAIL';

  const result: PatternQualityResult = {
    patternId: pattern.id,
    patternName: pattern.name,
    redTeam: {
      verdict: review.verdict,
      score: review.overallScore,
      passed: redTeamPassed,
    },
    research: {
      verdict: researchVerdict,
      totalClaims: claims.length,
      verified: summary.verified + summary.partially,
      passed: researchPassed,
    },
    overallPassed: redTeamPassed && researchPassed,
  };

  return { review, verification, result };
}

/**
 * Format combined summary for a single pattern
 */
function formatCombinedSummary(result: PatternQualityResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('='.repeat(60)));
  lines.push(chalk.bold('QUALITY GATE SUMMARY'));
  lines.push(chalk.bold('='.repeat(60)));
  lines.push('');

  lines.push(`Pattern: ${result.patternId}. ${result.patternName}`);
  lines.push('');

  // Red Team result
  const rtColor = result.redTeam.passed ? chalk.green : chalk.red;
  const rtIcon = result.redTeam.passed ? '\u2713' : '\u2717';
  lines.push(
    `  ${rtColor(rtIcon)} Red Team:    ${result.redTeam.verdict.padEnd(10)} (score: ${result.redTeam.score.toFixed(1)}/10)`
  );

  // Research result
  const rvColor = result.research.passed ? chalk.green : chalk.red;
  const rvIcon = result.research.passed ? '\u2713' : '\u2717';
  const claimInfo =
    result.research.totalClaims > 0
      ? `${result.research.verified}/${result.research.totalClaims} verified`
      : 'no claims';
  lines.push(
    `  ${rvColor(rvIcon)} Research:    ${result.research.verdict.padEnd(10)} (${claimInfo})`
  );

  lines.push('');

  // Overall verdict
  if (result.overallPassed) {
    lines.push(chalk.bgGreen.black.bold(' QUALITY GATE: PASSED '));
  } else {
    const failures: string[] = [];
    if (!result.redTeam.passed) failures.push('Red Team');
    if (!result.research.passed) failures.push('Research');
    lines.push(chalk.bgRed.white.bold(` QUALITY GATE: FAILED (${failures.join(' + ')}) `));
  }

  lines.push('');
  lines.push(chalk.bold('='.repeat(60)));

  return lines.join('\n');
}

/**
 * Format batch summary
 */
function formatBatchCombinedSummary(results: PatternQualityResult[]): string {
  const lines: string[] = [];

  const passed = results.filter((r) => r.overallPassed).length;
  const redTeamFailed = results.filter((r) => !r.redTeam.passed).length;
  const researchFailed = results.filter((r) => !r.research.passed).length;
  const bothFailed = results.filter((r) => !r.redTeam.passed && !r.research.passed).length;

  lines.push('');
  lines.push(chalk.bold('='.repeat(60)));
  lines.push(chalk.bold(`QUALITY GATE BATCH SUMMARY - ${results.length} patterns`));
  lines.push(chalk.bold('='.repeat(60)));
  lines.push('');

  // Overall stats
  const passRate = ((passed / results.length) * 100).toFixed(0);
  lines.push(chalk.bold.underline('Overall:'));
  lines.push(chalk.green(`  Passed:           ${passed} (${passRate}%)`));
  lines.push(chalk.red(`  Failed:           ${results.length - passed}`));
  lines.push('');

  // Breakdown
  lines.push(chalk.bold.underline('Failure Breakdown:'));
  lines.push(`  Red Team only:    ${redTeamFailed - bothFailed}`);
  lines.push(`  Research only:    ${researchFailed - bothFailed}`);
  lines.push(`  Both failed:      ${bothFailed}`);
  lines.push('');

  // Red Team verdicts
  const rtPublish = results.filter((r) => r.redTeam.verdict === 'PUBLISH').length;
  const rtRevise = results.filter((r) => r.redTeam.verdict === 'REVISE').length;
  const rtRethink = results.filter((r) => r.redTeam.verdict === 'RETHINK').length;

  lines.push(chalk.bold.underline('Red Team Verdicts:'));
  lines.push(chalk.green(`  PUBLISH:          ${rtPublish}`));
  lines.push(chalk.yellow(`  REVISE:           ${rtRevise}`));
  lines.push(chalk.red(`  RETHINK:          ${rtRethink}`));
  lines.push('');

  // Research verdicts
  const rvClean = results.filter((r) => r.research.verdict === 'CLEAN').length;
  const rvCaution = results.filter((r) => r.research.verdict === 'CAUTION').length;
  const rvFail = results.filter((r) => r.research.verdict === 'FAIL').length;

  lines.push(chalk.bold.underline('Research Verdicts:'));
  lines.push(chalk.green(`  CLEAN:            ${rvClean}`));
  lines.push(chalk.yellow(`  CAUTION:          ${rvCaution}`));
  lines.push(chalk.red(`  FAIL:             ${rvFail}`));
  lines.push('');

  // Failed patterns list
  const failed = results.filter((r) => !r.overallPassed);
  if (failed.length > 0) {
    lines.push(chalk.bold.underline('Patterns Requiring Attention:'));
    for (const f of failed) {
      const issues: string[] = [];
      if (!f.redTeam.passed) issues.push(`RT: ${f.redTeam.verdict}`);
      if (!f.research.passed) issues.push(`RV: ${f.research.verdict}`);
      lines.push(chalk.red(`  #${f.patternId.toString().padStart(3)} ${f.patternName.substring(0, 35).padEnd(35)} [${issues.join(', ')}]`));
    }
    lines.push('');
  }

  // Passed patterns (top 5 by score)
  const topPassed = results
    .filter((r) => r.overallPassed)
    .sort((a, b) => b.redTeam.score - a.redTeam.score)
    .slice(0, 5);

  if (topPassed.length > 0) {
    lines.push(chalk.bold.underline('Top Scoring Patterns:'));
    for (const p of topPassed) {
      lines.push(
        chalk.green(
          `  #${p.patternId.toString().padStart(3)} ${p.patternName.substring(0, 35).padEnd(35)} [RT: ${p.redTeam.score.toFixed(1)}, RV: ${p.research.verified}/${p.research.totalClaims}]`
        )
      );
    }
    lines.push('');
  }

  lines.push(chalk.bold('='.repeat(60)));

  return lines.join('\n');
}

/**
 * Determine exit code from results
 */
function getExitCode(results: PatternQualityResult[]): number {
  const anyRedTeamFail = results.some((r) => !r.redTeam.passed);
  const anyResearchFail = results.some((r) => !r.research.passed);

  if (anyRedTeamFail && anyResearchFail) return 3;
  if (anyResearchFail) return 2;
  if (anyRedTeamFail) return 1;
  return 0;
}

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('quality-gate')
  .description('Language A Quality Gate - Red Team + Research Verification')
  .version('1.0.0');

program
  .option('--id <number>', 'Pattern ID to check', parseInt)
  .option('--draft <path>', 'Path to draft markdown file')
  .option('--batch <path>', 'Batch mode: path to patterns.json')
  .option('--strict', 'Strict mode for both tools')
  .option('--summary', 'Show summary only (batch mode)')
  .action(async (options: QualityGateOptions) => {
    try {
      // Single pattern mode (by ID)
      if (options.id !== undefined) {
        const pattern = parsePatternFromJson(options.id);
        if (!pattern) {
          console.error(`Pattern ${options.id} not found in catalog`);
          process.exit(1);
        }

        console.log(chalk.bold.cyan(`\nQuality Gate: Pattern ${pattern.id} - ${pattern.name}`));
        console.log(chalk.bold.cyan('='.repeat(60)));

        const { result } = await runQualityGate(pattern, {
          strict: options.strict,
          verbose: true,
        });

        console.log(formatCombinedSummary(result));

        const exitCode = getExitCode([result]);
        process.exit(exitCode);
      }

      // Draft file mode
      if (options.draft) {
        const draftPath = path.resolve(process.cwd(), options.draft);
        const pattern = parseDraftFile(draftPath);
        if (!pattern) {
          console.error(`Could not parse draft file: ${options.draft}`);
          process.exit(1);
        }

        console.log(chalk.bold.cyan(`\nQuality Gate: Draft ${pattern.id} - ${pattern.name}`));
        console.log(chalk.bold.cyan('='.repeat(60)));
        console.log(chalk.gray(`Source: ${draftPath}`));

        const { result } = await runQualityGate(pattern, {
          strict: options.strict,
          verbose: true,
        });

        console.log(formatCombinedSummary(result));

        const exitCode = getExitCode([result]);
        process.exit(exitCode);
      }

      // Batch mode
      if (options.batch) {
        const patterns = loadPatternCatalog();

        if (patterns.length === 0) {
          console.error('No patterns found');
          process.exit(1);
        }

        console.log(chalk.bold.cyan(`\nQuality Gate: Batch mode - ${patterns.length} patterns`));
        console.log(chalk.bold.cyan('='.repeat(60)));
        console.log('');

        const results: PatternQualityResult[] = [];
        const startTime = Date.now();

        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];

          // Progress indicator
          process.stdout.write(
            `\rProcessing ${i + 1}/${patterns.length}: ${pattern.name.substring(0, 30).padEnd(30)}`
          );

          try {
            const { result } = await runQualityGate(pattern, {
              strict: options.strict,
              verbose: !options.summary,
            });

            results.push(result);

            // Rate limiting between patterns
            if (i < patterns.length - 1) {
              await delay(3000);
            }
          } catch (error) {
            console.error(`\nError processing pattern ${pattern.id}: ${error}`);
            // Push a failed result and continue
            results.push({
              patternId: pattern.id,
              patternName: pattern.name,
              redTeam: { verdict: 'RETHINK', score: 0, passed: false },
              research: { verdict: 'FAIL', totalClaims: 0, verified: 0, passed: false },
              overallPassed: false,
            });
          }
        }

        console.log('\n');
        console.log(formatBatchCombinedSummary(results));

        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`\nCompleted in ${elapsed} minutes`);

        const exitCode = getExitCode(results);
        process.exit(exitCode);
      }

      // No mode specified
      console.error('Please provide --id <number>, --draft <path>, or --batch <path>');
      program.help();
      process.exit(1);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
