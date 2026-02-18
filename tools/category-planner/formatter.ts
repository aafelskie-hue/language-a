/**
 * Category Planner Formatter
 * Terminal and markdown output formatting
 */

import chalk from 'chalk';
import type {
  AnalysisResult,
  ValidationReport,
  PatternSlot,
  ScaleDistribution,
  CategoryCoverage,
  NetworkHealth,
  TopicGap,
} from './types.js';

/**
 * Format the complete analysis result for terminal output
 */
export function formatAnalysisResult(analysis: AnalysisResult): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold('       CATEGORY PLANNER — ANALYSIS'));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Summary
  lines.push(chalk.bold.underline('Summary:'));
  lines.push(`  Existing patterns:  ${analysis.existingPatterns}`);
  lines.push(`  Target patterns:    ${analysis.targetPatterns}`);
  lines.push(`  Slots needed:       ${chalk.yellow(analysis.slotsNeeded.toString())}`);
  lines.push('');

  // Scale Distribution
  lines.push(chalk.bold.underline('Scale Distribution (current → target):'));
  lines.push(formatScaleBar('Neighborhood', analysis.scaleDistribution.neighborhood,
    analysis.scaleDistribution.targets.neighborhoodMin,
    analysis.scaleDistribution.targets.neighborhoodMax,
    analysis.existingPatterns));
  lines.push(formatScaleBar('Building', analysis.scaleDistribution.building,
    analysis.scaleDistribution.targets.buildingMin,
    analysis.scaleDistribution.targets.buildingMax,
    analysis.existingPatterns));
  lines.push(formatScaleBar('Construction', analysis.scaleDistribution.construction,
    analysis.scaleDistribution.targets.constructionMin,
    analysis.scaleDistribution.targets.constructionMax,
    analysis.existingPatterns));
  lines.push('');

  // Category Coverage
  lines.push(chalk.bold.underline('Category Coverage:'));
  for (const cat of analysis.categoryDistribution) {
    lines.push(formatCategoryBar(cat));
  }
  lines.push('');

  // Network Health
  lines.push(chalk.bold.underline('Network Health:'));
  lines.push(formatNetworkHealth(analysis.networkHealth));
  lines.push('');

  // Cold Climate
  lines.push(chalk.bold.underline('Cold Climate Coverage:'));
  const coldRate = analysis.coldClimateMetrics.rate;
  const coldStatus = coldRate >= 0.15 ? chalk.green('✓') : chalk.yellow('⚠');
  lines.push(`  ${coldStatus} ${analysis.coldClimateMetrics.ids.length} patterns (${(coldRate * 100).toFixed(0)}%) — target ≥15%`);
  if (analysis.coldClimateMetrics.keywords.length > 0) {
    lines.push(`  Keywords found: ${analysis.coldClimateMetrics.keywords.slice(0, 5).join(', ')}`);
  }
  lines.push('');

  // Topic Gaps
  if (analysis.topicGaps.length > 0) {
    lines.push(chalk.bold.underline('Topic Gaps Detected:'));
    const highPriority = analysis.topicGaps.filter(g => g.priority === 'high');
    const mediumPriority = analysis.topicGaps.filter(g => g.priority === 'medium');

    if (highPriority.length > 0) {
      lines.push(chalk.red(`  ⚠ ${highPriority.length} high-priority gaps:`));
      for (const gap of highPriority.slice(0, 5)) {
        lines.push(chalk.red(`    - ${gap.topic} (${gap.suggestedCategory}, ${gap.suggestedScale})`));
      }
    }

    if (mediumPriority.length > 0) {
      lines.push(chalk.yellow(`  ○ ${mediumPriority.length} medium-priority gaps:`));
      for (const gap of mediumPriority.slice(0, 5)) {
        lines.push(chalk.yellow(`    - ${gap.topic} (${gap.suggestedCategory}, ${gap.suggestedScale})`));
      }
    }

    if (analysis.topicGaps.length > 10) {
      lines.push(chalk.gray(`    ... and ${analysis.topicGaps.length - 10} more`));
    }
    lines.push('');
  }

  // Footer
  lines.push(chalk.gray(`Generated: ${analysis.timestamp}`));
  lines.push(chalk.bold('═'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format scale distribution bar
 */
function formatScaleBar(
  label: string,
  current: number,
  targetMin: number,
  targetMax: number,
  total: number
): string {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const barLength = 25;
  const filled = Math.round((pct / 100) * barLength);
  const empty = barLength - filled;

  // Determine color based on target range
  const targetMinPct = (targetMin / 254) * 100;
  const targetMaxPct = (targetMax / 254) * 100;

  let color: (s: string) => string;
  if (pct >= targetMinPct && pct <= targetMaxPct) {
    color = chalk.green;
  } else if (pct < targetMinPct) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const status = pct >= targetMinPct && pct <= targetMaxPct ? chalk.green('✓') : chalk.yellow('○');

  return `  ${label.padEnd(14)} ${bar} ${current.toString().padStart(3)} (${pct.toFixed(0)}%) ${status}`;
}

/**
 * Format category coverage bar
 */
function formatCategoryBar(cat: CategoryCoverage): string {
  const pct = cat.percentage;
  const barLength = 15;
  const filled = Math.round((pct / 100) * barLength);
  const empty = barLength - filled;

  let color: (s: string) => string;
  if (pct >= 50) {
    color = chalk.green;
  } else if (pct >= 20) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

  // Truncate label if needed
  const label = cat.categoryLabel.length > 25
    ? cat.categoryLabel.substring(0, 22) + '...'
    : cat.categoryLabel;

  const status = cat.existing === 0 ? chalk.red('EMPTY') : `${cat.existing}/${cat.estimated}`;

  return `  ${label.padEnd(26)} ${bar} ${status.padStart(7)} (${pct.toFixed(0)}%)`;
}

/**
 * Format network health metrics
 */
function formatNetworkHealth(health: NetworkHealth): string {
  const lines: string[] = [];

  // Average connections
  const avgStatus = health.averageConnections >= 4 && health.averageConnections <= 6
    ? chalk.green('✓')
    : chalk.yellow('○');
  lines.push(`  ${avgStatus} Average connections: ${health.averageConnections.toFixed(1)} per pattern (target: 4-6)`);

  // Orphans
  const orphanStatus = health.orphans.length === 0 ? chalk.green('✓') : chalk.yellow('⚠');
  lines.push(`  ${orphanStatus} Orphan patterns: ${health.orphans.length} (< 3 connections)`);

  // Hubs
  const hubStatus = health.hubs.length <= 2 ? chalk.green('✓') : chalk.yellow('⚠');
  lines.push(`  ${hubStatus} Hub patterns: ${health.hubs.length} (> 8 connections)`);

  // Dead references
  const deadStatus = health.deadReferences.length === 0 ? chalk.green('✓') : chalk.red('✗');
  lines.push(`  ${deadStatus} Dead references: ${health.deadReferences.length}`);

  // Scale crossing
  const crossStatus = health.scaleCrossingRate >= 0.5 ? chalk.green('✓') : chalk.yellow('○');
  lines.push(`  ${crossStatus} Scale-crossing rate: ${(health.scaleCrossingRate * 100).toFixed(0)}%`);

  return lines.join('\n');
}

/**
 * Format validation report for terminal output
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold('       CATALOG PLAN VALIDATION'));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Total patterns
  const totalStatus = report.totalPatterns === 254 ? chalk.green('✓') : chalk.red('✗');
  lines.push(chalk.bold(`TOTAL PATTERNS: ${report.totalPatterns} ${totalStatus}`));
  lines.push('');

  // Scale distribution
  lines.push(chalk.bold.underline('Scale Distribution:'));
  const sd = report.scaleDistribution;
  lines.push(formatValidationScaleRow('Neighborhood', sd.neighborhood, sd.neighborhoodPct, 0.28, 0.35));
  lines.push(formatValidationScaleRow('Building', sd.building, sd.buildingPct, 0.43, 0.51));
  lines.push(formatValidationScaleRow('Construction', sd.construction, sd.constructionPct, 0.16, 0.24));
  lines.push('');

  // Category balance
  lines.push(chalk.bold.underline('Category Balance:'));
  for (const [catId, data] of Object.entries(report.categoryDistribution)) {
    const scaleInfo = `[N:${data.neighborhood} B:${data.building} C:${data.construction}]`;
    const status = data.hasMultipleScales ? chalk.green('✓') : chalk.yellow('○');
    lines.push(`  ${catId.padEnd(22)} ${data.total.toString().padStart(2)} patterns ${scaleInfo.padEnd(16)} ${status}`);
  }
  lines.push('');

  // Network health
  lines.push(chalk.bold.underline('Network Health:'));
  lines.push(formatNetworkHealth(report.networkHealth));
  lines.push('');

  // Vertical chains
  lines.push(chalk.bold.underline('Vertical Chains:'));
  const vc = report.verticalChains;
  const chainStatus = vc.broken.length === 0 ? chalk.green('✓') : chalk.yellow('⚠');
  lines.push(`  ${chainStatus} Complete chains: ${vc.complete}`);
  if (vc.broken.length > 0) {
    lines.push(chalk.yellow(`  ⚠ Broken chains: ${vc.broken.length}`));
  }
  lines.push('');

  // Cold climate
  lines.push(chalk.bold.underline('Cold Climate:'));
  const coldStatus = report.coldClimateRate >= 0.15 ? chalk.green('✓') : chalk.yellow('⚠');
  lines.push(`  ${coldStatus} Coverage: ${(report.coldClimateRate * 100).toFixed(0)}% (target ≥15%)`);
  lines.push('');

  // Issues
  if (report.issues.length > 0) {
    lines.push(chalk.bold.underline('Issues:'));
    for (const issue of report.issues) {
      lines.push(chalk.yellow(`  ⚠ ${issue}`));
    }
    lines.push('');
  }

  // Verdict banner
  const verdictColor = report.verdict === 'VALID'
    ? chalk.bgGreen.black
    : report.verdict === 'ISSUES'
      ? chalk.bgYellow.black
      : chalk.bgRed.white;
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(verdictColor(chalk.bold(`  VERDICT: ${report.verdict}  `)));
  lines.push(chalk.bold('═'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format scale row for validation
 */
function formatValidationScaleRow(
  label: string,
  count: number,
  pct: number,
  targetMin: number,
  targetMax: number
): string {
  const pctStr = `${(pct * 100).toFixed(0)}%`;
  const targetStr = `target ${(targetMin * 100).toFixed(0)}-${(targetMax * 100).toFixed(0)}%`;
  const status = pct >= targetMin && pct <= targetMax ? chalk.green('✓') : chalk.yellow('○');

  return `  ${label.padEnd(14)} ${count.toString().padStart(3)} (${pctStr.padStart(3)}) ${status} ${targetStr}`;
}

/**
 * Format plan statistics
 */
export function formatPlanStats(slots: PatternSlot[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold('       CATALOG PLAN STATISTICS'));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Status breakdown
  const existing = slots.filter(s => s.status === 'existing').length;
  const planned = slots.filter(s => s.status === 'planned').length;
  lines.push(chalk.bold.underline('Status:'));
  lines.push(`  Existing: ${existing}`);
  lines.push(`  Planned:  ${planned}`);
  lines.push(`  Total:    ${slots.length}`);
  lines.push('');

  // Priority breakdown
  const high = slots.filter(s => s.priority === 'high' && s.status === 'planned').length;
  const medium = slots.filter(s => s.priority === 'medium' && s.status === 'planned').length;
  const low = slots.filter(s => s.priority === 'low' && s.status === 'planned').length;
  lines.push(chalk.bold.underline('Priority Distribution (planned only):'));
  lines.push(`  HIGH:   ${high} patterns (write first)`);
  lines.push(`  MEDIUM: ${medium} patterns (fill network)`);
  lines.push(`  LOW:    ${low} patterns (depth)`);
  lines.push('');

  // Cold climate
  const coldClimate = slots.filter(s => s.coldClimate).length;
  lines.push(chalk.bold.underline('Cold Climate:'));
  lines.push(`  Cold-climate patterns: ${coldClimate} (${((coldClimate / slots.length) * 100).toFixed(0)}%)`);
  lines.push('');

  lines.push(chalk.bold('═'.repeat(60)));

  return lines.join('\n');
}

/**
 * Export catalog plan as markdown
 */
export function exportAsMarkdown(slots: PatternSlot[], report?: ValidationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# Language A — Complete Catalog Plan');
  lines.push('## 254 Patterns for Enduring Places');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`Status: ${report?.verdict === 'VALID' ? 'APPROVED' : 'DRAFT — awaiting review'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by category
  const categories = [...new Set(slots.map(s => s.category))].sort();

  for (const categoryId of categories) {
    const categorySlots = slots.filter(s => s.category === categoryId).sort((a, b) => a.id - b.id);
    if (categorySlots.length === 0) continue;

    const firstSlot = categorySlots[0];
    lines.push(`### ${categoryId}`);
    lines.push('');
    lines.push('| # | Name | Scale | Brief | Priority | Cold? |');
    lines.push('|---|------|-------|-------|----------|-------|');

    for (const slot of categorySlots) {
      const num = String(slot.id).padStart(3, '0');
      const scaleAbbr = slot.scale === 'neighborhood' ? 'N' : slot.scale === 'building' ? 'B' : 'C';
      const brief = slot.status === 'existing' ? '★ EXISTING' : (slot.brief || '—').substring(0, 50);
      const priority = slot.status === 'existing' ? '—' : slot.priority.toUpperCase();
      const cold = slot.coldClimate ? '❄' : '';

      lines.push(`| ${num} | ${slot.name} | ${scaleAbbr} | ${brief} | ${priority} | ${cold} |`);
    }

    lines.push('');
  }

  // Statistics
  lines.push('---');
  lines.push('');
  lines.push('### Network Statistics');
  lines.push('');

  const existing = slots.filter(s => s.status === 'existing').length;
  const planned = slots.filter(s => s.status === 'planned').length;
  const coldClimate = slots.filter(s => s.coldClimate).length;

  const neighborhood = slots.filter(s => s.scale === 'neighborhood').length;
  const building = slots.filter(s => s.scale === 'building').length;
  const construction = slots.filter(s => s.scale === 'construction').length;

  lines.push(`- Total patterns: ${slots.length}`);
  lines.push(`- Existing: ${existing}, Planned: ${planned}`);
  lines.push(`- Scale: N=${neighborhood} (${((neighborhood / slots.length) * 100).toFixed(0)}%) / B=${building} (${((building / slots.length) * 100).toFixed(0)}%) / C=${construction} (${((construction / slots.length) * 100).toFixed(0)}%)`);
  lines.push(`- Cold-climate patterns: ${coldClimate} (${((coldClimate / slots.length) * 100).toFixed(0)}%)`);
  lines.push('');

  // Priority distribution
  const high = slots.filter(s => s.priority === 'high' && s.status === 'planned').length;
  const medium = slots.filter(s => s.priority === 'medium' && s.status === 'planned').length;
  const low = slots.filter(s => s.priority === 'low' && s.status === 'planned').length;

  lines.push('### Priority Distribution');
  lines.push('');
  lines.push(`- HIGH: ${high} patterns (write first — other patterns depend on these)`);
  lines.push(`- MEDIUM: ${medium} patterns (fill the network)`);
  lines.push(`- LOW: ${low} patterns (depth and specialization)`);
  lines.push('');

  // Writing order
  lines.push('### Writing Order');
  lines.push('');
  lines.push(`Phase 1 — Foundation (${high} HIGH priority patterns)`);
  lines.push(`Phase 2 — Network (${medium} MEDIUM priority patterns)`);
  lines.push(`Phase 3 — Depth (${low} LOW priority patterns)`);

  return lines.join('\n');
}

/**
 * Format progress message
 */
export function formatProgress(message: string, step: number, total: number): string {
  const pct = Math.round((step / total) * 100);
  const barLength = 20;
  const filled = Math.round((pct / 100) * barLength);
  const empty = barLength - filled;
  const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

  return `${bar} ${step}/${total} (${pct}%) — ${message}`;
}
