/**
 * Pattern Generator Formatter
 * Terminal output formatting
 */

import chalk from 'chalk';
import type { GenerationResult, BatchGenerationSummary, PatternSlot, ResearchResult } from './types.js';

const WIDTH = 60;

/**
 * Format header
 */
export function formatHeader(title: string): string {
  const line = chalk.bold('═'.repeat(WIDTH));
  return `
${line}
${chalk.bold.white(title.toUpperCase())}
${line}
`;
}

/**
 * Format section header
 */
export function formatSection(title: string): string {
  return chalk.bold.cyan(`\n─── ${title} ───\n`);
}

/**
 * Format progress message
 */
export function formatProgress(message: string, step: number, total: number): string {
  const percent = Math.round((step / total) * 100);
  const barWidth = 20;
  const filled = Math.round((step / total) * barWidth);
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(barWidth - filled));
  return `[${bar}] ${percent}% ${message}`;
}

/**
 * Format slot info before drafting
 */
export function formatSlotInfo(slot: PatternSlot): string {
  const lines = [
    formatSection(`Pattern ${slot.id}: ${slot.name}`),
    `${chalk.gray('Scale:')} ${formatScale(slot.scale)}`,
    `${chalk.gray('Category:')} ${slot.categoryLabel || slot.category}`,
    `${chalk.gray('Priority:')} ${formatPriority(slot.priority)}`,
    `${chalk.gray('Brief:')} ${slot.brief}`,
    `${chalk.gray('Tension:')} ${slot.tension}`,
    `${chalk.gray('Connections:')} ${slot.connections.join(', ')}`,
    `${chalk.gray('Cold Climate:')} ${slot.coldClimate ? chalk.cyan('Yes') : 'No'}`,
  ];

  if (slot.alexanderRef && slot.alexanderRef.length > 0) {
    lines.push(`${chalk.gray('Alexander Refs:')} ${slot.alexanderRef.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format scale with color
 */
function formatScale(scale: string): string {
  switch (scale) {
    case 'neighborhood':
      return chalk.magenta(scale);
    case 'building':
      return chalk.yellow(scale);
    case 'construction':
      return chalk.cyan(scale);
    default:
      return scale;
  }
}

/**
 * Format priority with color
 */
function formatPriority(priority: string): string {
  switch (priority) {
    case 'high':
      return chalk.red(priority.toUpperCase());
    case 'medium':
      return chalk.yellow(priority);
    case 'low':
      return chalk.gray(priority);
    default:
      return priority;
  }
}

/**
 * Format generation result
 */
export function formatGenerationResult(result: GenerationResult): string {
  const lines = [
    formatSection('Generation Complete'),
    `${chalk.green('✓')} Pattern: ${chalk.bold(result.patternName)} (ID: ${result.patternId})`,
    `${chalk.gray('Draft:')} ${result.draftPath}`,
    `${chalk.gray('Confidence:')} ${formatConfidence(result.confidence)}`,
    `${chalk.gray('Research Used:')} ${result.researchUsed ? chalk.green('Yes') : 'No'}`,
    `${chalk.gray('Revisions:')} ${result.autoReviseAttempts}`,
    `${chalk.gray('Model:')} ${result.model}`,
    `${chalk.gray('Time:')} ${result.timestamp}`,
  ];

  if (result.finalRedTeamVerdict) {
    lines.push(`${chalk.gray('Red Team:')} ${formatVerdict(result.finalRedTeamVerdict)} (${result.finalRedTeamScore})`);
  }

  return lines.join('\n');
}

/**
 * Format confidence rating
 */
export function formatConfidence(confidence: number): string {
  switch (confidence) {
    case 2:
      return chalk.green('★★ Strong');
    case 1:
      return chalk.yellow('★ Moderate');
    case 0:
      return chalk.gray('☆ Speculative');
    default:
      return chalk.gray('Unknown');
  }
}

/**
 * Format verdict with color
 */
function formatVerdict(verdict: string): string {
  switch (verdict.toLowerCase()) {
    case 'publish':
      return chalk.green('PUBLISH');
    case 'revise':
      return chalk.yellow('REVISE');
    case 'reject':
      return chalk.red('REJECT');
    default:
      return verdict;
  }
}

/**
 * Format research results
 */
export function formatResearchResult(research: ResearchResult): string {
  const lines = [formatSection('Research Results')];

  if (research.programs.length > 0) {
    lines.push(chalk.bold('Programs:'));
    for (const p of research.programs.slice(0, 3)) {
      lines.push(`  • ${p.name} (${p.location}, ${p.year})`);
    }
    if (research.programs.length > 3) {
      lines.push(chalk.gray(`    ... and ${research.programs.length - 3} more`));
    }
  }

  if (research.statistics.length > 0) {
    lines.push(chalk.bold('Statistics:'));
    for (const s of research.statistics.slice(0, 3)) {
      lines.push(`  • ${s.claim.slice(0, 60)}...`);
    }
    if (research.statistics.length > 3) {
      lines.push(chalk.gray(`    ... and ${research.statistics.length - 3} more`));
    }
  }

  if (research.studies.length > 0) {
    lines.push(chalk.bold('Studies:'));
    for (const s of research.studies.slice(0, 3)) {
      lines.push(`  • ${s.authors} (${s.year})`);
    }
    if (research.studies.length > 3) {
      lines.push(chalk.gray(`    ... and ${research.studies.length - 3} more`));
    }
  }

  if (research.examples.length > 0) {
    lines.push(chalk.bold('Built Examples:'));
    for (const e of research.examples.slice(0, 3)) {
      lines.push(`  • ${e.location}`);
    }
    if (research.examples.length > 3) {
      lines.push(chalk.gray(`    ... and ${research.examples.length - 3} more`));
    }
  }

  lines.push('');
  lines.push(`${chalk.gray('Evidence Strength:')} ${formatEvidenceStrength(research.evidenceStrength)}`);
  lines.push(`${chalk.gray('Suggested Confidence:')} ${formatConfidence(research.suggestedConfidence)}`);

  if (research.notes) {
    lines.push(`${chalk.gray('Notes:')} ${research.notes}`);
  }

  return lines.join('\n');
}

/**
 * Format evidence strength
 */
function formatEvidenceStrength(strength: string): string {
  switch (strength) {
    case 'strong':
      return chalk.green('Strong');
    case 'moderate':
      return chalk.yellow('Moderate');
    case 'thin':
      return chalk.red('Thin');
    default:
      return strength;
  }
}

/**
 * Format batch generation summary
 */
export function formatBatchSummary(summary: BatchGenerationSummary): string {
  const lines = [
    formatHeader('Batch Generation Complete'),
    '',
    `${chalk.gray('Total Patterns:')} ${summary.total}`,
    `${chalk.gray('Generated:')} ${chalk.green(summary.generated)}`,
    `${chalk.gray('Passed Red Team:')} ${chalk.green(summary.passedRedTeam)}`,
    `${chalk.gray('Needs Human Review:')} ${chalk.yellow(summary.needsHumanReview)}`,
    `${chalk.gray('Failed:')} ${chalk.red(summary.failed)}`,
    '',
    `${chalk.gray('Avg Red Team Score:')} ${summary.averageRedTeamScore.toFixed(1)}`,
    `${chalk.gray('Avg Revise Attempts:')} ${summary.averageReviseAttempts.toFixed(1)}`,
  ];

  // By priority breakdown
  lines.push('');
  lines.push(chalk.bold('By Priority:'));

  const { high, medium, low } = summary.byPriority;
  lines.push(`  ${chalk.red('HIGH:')} ${high.generated}/${high.total} generated, ${high.passed} passed`);
  lines.push(`  ${chalk.yellow('MEDIUM:')} ${medium.generated}/${medium.total} generated, ${medium.passed} passed`);
  lines.push(`  ${chalk.gray('LOW:')} ${low.generated}/${low.total} generated, ${low.passed} passed`);

  return lines.join('\n');
}

/**
 * Format error message
 */
export function formatError(error: string): string {
  return `${chalk.red('✗')} ${chalk.red('Error:')} ${error}`;
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
  return `${chalk.yellow('⚠')} ${chalk.yellow('Warning:')} ${message}`;
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return `${chalk.green('✓')} ${message}`;
}

/**
 * Format info message
 */
export function formatInfo(message: string): string {
  return `${chalk.blue('ℹ')} ${message}`;
}

/**
 * Format drafting status
 */
export function formatDraftingStatus(patternName: string, step: string): string {
  return `${chalk.cyan('⋯')} Drafting ${chalk.bold(patternName)}: ${step}`;
}

/**
 * Format revision status
 */
export function formatRevisionStatus(patternName: string, attempt: number, maxAttempts: number): string {
  return `${chalk.yellow('↺')} Revising ${chalk.bold(patternName)} (attempt ${attempt}/${maxAttempts})`;
}

/**
 * Format CLI usage help
 */
export function formatUsage(): string {
  return `
${formatHeader('Pattern Generator')}

${chalk.bold('USAGE')}
  npx tsx tools/pattern-generator/generate.ts [options]

${chalk.bold('SINGLE PATTERN')}
  --id <number>        Draft pattern by catalog ID
  --research           Search for evidence before drafting
  --context <text>     Add Andrew's notes to the prompt
  --gate               Run quality gate after drafting

${chalk.bold('REVISION')}
  --revise <path>      Revise an existing draft
  --feedback <text>    Feedback to address in revision

${chalk.bold('BATCH MODE')}
  --batch              Enable batch generation
  --priority <level>   Filter by priority (high/medium/low)
  --category <id>      Filter by category
  --from <id>          Start of ID range
  --to <id>            End of ID range
  --auto-revise <n>    Auto-revise up to n times

${chalk.bold('OUTPUT')}
  --output <format>    Output format: terminal (default) or json
  --quiet              Suppress progress output

${chalk.bold('EXAMPLES')}
  ${chalk.gray('# Draft a single pattern with research')}
  npx tsx tools/pattern-generator/generate.ts --id 34 --research

  ${chalk.gray('# Revise a draft with feedback')}
  npx tsx tools/pattern-generator/generate.ts --revise drafts/034-winter-walking.md \\
    --feedback "RT: spatial specificity needs work"

  ${chalk.gray('# Batch generate high priority patterns')}
  npx tsx tools/pattern-generator/generate.ts --batch --priority high --auto-revise 3
`;
}
