/**
 * Network Checker Formatter
 * Terminal output formatting
 */

import chalk from 'chalk';
import type { NetworkReport, NetworkNode, VerticalChain } from './types.js';

/**
 * Format the full network report for terminal output
 */
export function formatNetworkReport(report: NetworkReport, nodes: NetworkNode[]): string {
  const lines: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Header
  lines.push('');
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push(chalk.bold(`NETWORK INTEGRITY CHECK — ${report.totalPatterns} patterns`));
  lines.push(chalk.bold('═'.repeat(60)));
  lines.push('');

  // Connectivity
  lines.push(chalk.bold.underline('CONNECTIVITY'));
  lines.push(`  Total connections:     ${report.connectivity.totalConnections}`);
  lines.push(formatMetric('Average per pattern', report.connectivity.averagePerPattern.toFixed(1), 4, 6));
  lines.push(formatMetric('Orphans (< 3)', report.connectivity.orphans.length, 0, 0, true));
  lines.push(formatMetric('Hubs (> 8)', report.connectivity.hubs.length, 0, 3));
  lines.push('');

  // Scale Flow
  lines.push(chalk.bold.underline('SCALE FLOW'));
  lines.push(formatMetric('Neighborhood → Building', `${report.scaleFlow.neighborhoodToBuilding.toFixed(0)}%`, 80, 100));
  lines.push(formatMetric('Building → Construction', `${report.scaleFlow.buildingToConstruction.toFixed(0)}%`, 70, 100));
  lines.push(formatMetric('Scale-isolated', report.scaleFlow.scaleIsolated.length, 0, 5));
  lines.push('');

  // Vertical Chains
  lines.push(chalk.bold.underline('VERTICAL CHAINS'));
  lines.push(formatMetric('Complete (N→B→C)', report.verticalChains.complete.length, 10, 999));
  lines.push(formatMetric('Broken', report.verticalChains.broken.length, 0, 20));
  lines.push(formatMetric('Floating', report.verticalChains.floating.length, 0, 5, true));
  lines.push('');

  // Category Balance
  lines.push(chalk.bold.underline('CATEGORY BALANCE'));
  lines.push(formatMetric('Balance score', report.categoryBalance.balanceScore.toFixed(2) + '/1.00', 0.8, 1));
  const cats = Object.entries(report.categoryBalance.distribution).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    lines.push(`  Largest:  ${cats[0][0]} (${cats[0][1]})`);
    lines.push(`  Smallest: ${cats[cats.length - 1][0]} (${cats[cats.length - 1][1]})`);
  }
  lines.push('');

  // Network Quality
  lines.push(chalk.bold.underline('NETWORK QUALITY'));
  lines.push(formatMetric('Reciprocity', `${(report.reciprocity.reciprocityRate * 100).toFixed(0)}%`, 70, 100));
  lines.push(formatMetric('Dead references', report.deadReferences.length, 0, 0, true));
  const isolatedClusters = report.clusters.filter(c => c.isolated).length;
  lines.push(formatMetric('Isolated clusters', isolatedClusters, 0, 2));
  const integrationPct = report.totalPatterns > 0
    ? (report.alexanderIntegration.patternsWithRefs / report.totalPatterns * 100).toFixed(0)
    : '0';
  lines.push(formatMetric('Alexander integration', `${integrationPct}%`, 50, 100));
  lines.push('');

  // Issues Section
  lines.push(chalk.bold('─'.repeat(60)));
  lines.push('');

  if (report.issues.length > 0) {
    lines.push(chalk.bold.underline('ISSUES REQUIRING ATTENTION:'));
    lines.push('');

    // Orphans
    if (report.connectivity.orphans.length > 0) {
      lines.push(chalk.red(`  ✗ ORPHANS (${report.connectivity.orphans.length}):`));
      for (const orphan of report.connectivity.orphans.slice(0, 5)) {
        lines.push(chalk.red(`    Pattern ${orphan.id}: ${orphan.name} — ${orphan.connections} connection(s)`));
      }
      if (report.connectivity.orphans.length > 5) {
        lines.push(chalk.gray(`    ... and ${report.connectivity.orphans.length - 5} more`));
      }
      lines.push('');
    }

    // Hubs
    if (report.connectivity.hubs.length > 0) {
      lines.push(chalk.yellow(`  ⚠ HUBS (${report.connectivity.hubs.length}):`));
      for (const hub of report.connectivity.hubs.slice(0, 5)) {
        lines.push(chalk.yellow(`    Pattern ${hub.id}: ${hub.name} — ${hub.connections} connections`));
      }
      lines.push('');
    }

    // Scale-isolated
    if (report.scaleFlow.scaleIsolated.length > 0) {
      lines.push(chalk.yellow(`  ⚠ SCALE-ISOLATED (${report.scaleFlow.scaleIsolated.length}):`));
      for (const iso of report.scaleFlow.scaleIsolated.slice(0, 5)) {
        lines.push(chalk.yellow(`    Pattern ${iso.id}: ${iso.name} [${iso.scale}]`));
      }
      lines.push('');
    }

    // Dead references
    if (report.deadReferences.length > 0) {
      lines.push(chalk.red(`  ✗ DEAD REFERENCES (${report.deadReferences.length}):`));
      for (const ref of report.deadReferences.slice(0, 5)) {
        const fromNode = nodeMap.get(ref.from);
        lines.push(chalk.red(`    Pattern ${ref.from}${fromNode ? ` (${fromNode.name})` : ''} → Pattern ${ref.to} (does not exist)`));
      }
      if (report.deadReferences.length > 5) {
        lines.push(chalk.gray(`    ... and ${report.deadReferences.length - 5} more`));
      }
      lines.push('');
    }

    // Broken chains
    const brokenCount = report.verticalChains.broken.length;
    if (brokenCount > 0) {
      lines.push(chalk.yellow(`  ⚠ BROKEN CHAINS — top 5 needing repair:`));
      const toShow = report.verticalChains.broken.slice(0, 5);
      for (let i = 0; i < toShow.length; i++) {
        const chain = toShow[i];
        const nNames = chain.neighborhood.map(id => nodeMap.get(id)?.name || `#${id}`);
        const bNames = chain.building.map(id => nodeMap.get(id)?.name || `#${id}`);
        const cNames = chain.construction.map(id => nodeMap.get(id)?.name || `#${id}`);

        const nPart = nNames.length > 0 ? nNames[0] : '[no N]';
        const bPart = bNames.length > 0 ? bNames[0] : '[no B]';
        const cPart = cNames.length > 0 ? cNames[0] : '[no C]';

        lines.push(chalk.yellow(`    ${i + 1}. ${nPart} (N) → ${bPart} (B) → ${cPart} (C)`));
      }
      lines.push('');
    }
  } else {
    lines.push(chalk.green('  No issues found!'));
    lines.push('');
  }

  // Verdict
  lines.push(chalk.bold('═'.repeat(60)));
  const verdictColor = report.verdict === 'HEALTHY'
    ? chalk.bgGreen.black
    : report.verdict === 'ISSUES'
      ? chalk.bgYellow.black
      : chalk.bgRed.white;
  lines.push(verdictColor(chalk.bold(`  VERDICT: ${report.verdict} with ${report.criticalCount + report.advisoryCount} issues  `)));
  if (report.criticalCount > 0 || report.advisoryCount > 0) {
    lines.push(`  ${report.criticalCount} critical, ${report.advisoryCount} advisory`);
  }
  lines.push(chalk.bold('═'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format a metric line with status indicator
 */
function formatMetric(
  label: string,
  value: string | number,
  goodMin: number,
  goodMax: number,
  zeroIsBest: boolean = false
): string {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  let status: string;
  if (zeroIsBest) {
    status = numValue === 0 ? chalk.green('✓') : chalk.red('✗');
  } else if (numValue >= goodMin && numValue <= goodMax) {
    status = chalk.green('✓');
  } else if (numValue >= goodMin * 0.8) {
    status = chalk.yellow('○');
  } else {
    status = chalk.yellow('⚠');
  }

  return `  ${label.padEnd(24)} ${String(value).padStart(6)} ${status}`;
}

/**
 * Format a summary report (less detailed)
 */
export function formatSummaryReport(report: NetworkReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(`Network Check: ${report.totalPatterns} patterns`));
  lines.push('');

  const verdictColor = report.verdict === 'HEALTHY'
    ? chalk.green
    : report.verdict === 'ISSUES'
      ? chalk.yellow
      : chalk.red;

  lines.push(verdictColor(`Verdict: ${report.verdict}`));
  lines.push(`  Orphans: ${report.connectivity.orphans.length}`);
  lines.push(`  Dead refs: ${report.deadReferences.length}`);
  lines.push(`  Avg connections: ${report.connectivity.averagePerPattern.toFixed(1)}`);
  lines.push(`  Reciprocity: ${(report.reciprocity.reciprocityRate * 100).toFixed(0)}%`);
  lines.push(`  Complete chains: ${report.verticalChains.complete.length}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format report as JSON
 */
export function formatReportAsJson(report: NetworkReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format focus report (specific patterns)
 */
export function formatFocusReport(
  report: NetworkReport,
  focusIds: number[],
  nodes: NetworkNode[]
): string {
  const lines: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  lines.push('');
  lines.push(chalk.bold(`Focus Report: Patterns ${focusIds.join(', ')}`));
  lines.push(chalk.bold('─'.repeat(60)));
  lines.push('');

  for (const id of focusIds) {
    const node = nodeMap.get(id);
    if (!node) {
      lines.push(chalk.red(`Pattern ${id}: NOT FOUND`));
      continue;
    }

    lines.push(chalk.bold(`Pattern ${id}: ${node.name} [${node.scale}]`));
    lines.push(`  Category: ${node.category}`);
    lines.push(`  Connections: ${node.connectionCount}`);

    // Check if orphan
    if (node.connectionCount < 3) {
      lines.push(chalk.red(`  ✗ ORPHAN — needs ${3 - node.connectionCount} more connections`));
    }

    // Check if hub
    if (node.connectionCount > 8) {
      lines.push(chalk.yellow(`  ⚠ HUB — consider reducing connections`));
    }

    // Check dead references
    const deadRefs = report.deadReferences.filter(r => r.from === id);
    if (deadRefs.length > 0) {
      lines.push(chalk.red(`  ✗ Dead refs: ${deadRefs.map(r => r.to).join(', ')}`));
    }

    // Check scale isolation
    const isIsolated = report.scaleFlow.scaleIsolated.some(s => s.id === id);
    if (isIsolated) {
      lines.push(chalk.yellow(`  ⚠ Scale-isolated — only connects to ${node.scale} patterns`));
    }

    // Show connections
    lines.push(`  Up: ${node.connectionsUp.join(', ') || 'none'}`);
    lines.push(`  Down: ${node.connectionsDown.join(', ') || 'none'}`);
    lines.push('');
  }

  return lines.join('\n');
}
