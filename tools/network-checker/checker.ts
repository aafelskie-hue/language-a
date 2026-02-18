#!/usr/bin/env node
/**
 * Network Checker CLI
 * Analyze pattern network for structural integrity
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { buildGraph, findOrphans, findHubs, findDeadReferences, findScaleIsolated } from './graph.js';
import {
  calculateReciprocity,
  measureScaleFlow,
  calculateBalanceScore,
  calculateCategoryDistribution,
  detectClusters,
  calculateAlexanderIntegration,
  calculateConnectivity,
} from './metrics.js';
import { findVerticalChains, getStrongestChains, getBrokenChainsForRepair } from './chains.js';
import { formatNetworkReport, formatSummaryReport, formatReportAsJson, formatFocusReport } from './formatter.js';
import type { PatternInput, NetworkReport, CheckerOptions } from './types.js';

const program = new Command();

program
  .name('network-checker')
  .description('Analyze Language A pattern network for structural integrity')
  .version('1.0.0');

program
  .option('--summary', 'Show quick summary only')
  .option('--focus <ids>', 'Check specific patterns (comma-separated IDs)')
  .option('--compare <file>', 'Compare with previous report')
  .option('--output <format>', 'Output format: terminal or json', 'terminal')
  .option('--plan <file>', 'Check against catalog plan')
  .option('--suggest', 'Include AI-assisted fix suggestions (requires API key)');

program.parse();

const options: CheckerOptions = program.opts();

// Parse focus IDs if provided
if (options.focus) {
  options.focus = (options.focus as unknown as string).split(',').map(s => parseInt(s.trim(), 10));
}

async function main() {
  try {
    // Load patterns
    const patternsPath = path.resolve(process.cwd(), 'data/patterns.json');
    if (!fs.existsSync(patternsPath)) {
      console.error(chalk.red(`Error: ${patternsPath} not found`));
      process.exit(1);
    }

    const patterns: PatternInput[] = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
    console.log(chalk.cyan(`\nAnalyzing ${patterns.length} patterns...`));

    // Build the graph
    const { nodes, edges } = buildGraph(patterns);

    // Run all analyses
    const orphans = findOrphans(nodes);
    const hubs = findHubs(nodes);
    const deadRefs = findDeadReferences(nodes, edges);
    const scaleIsolated = findScaleIsolated(nodes);
    const scaleFlow = measureScaleFlow(nodes);
    const chains = findVerticalChains(nodes);
    const categoryDist = calculateCategoryDistribution(nodes);
    const balanceScore = calculateBalanceScore(categoryDist);
    const reciprocity = calculateReciprocity(nodes);
    const clusters = detectClusters(nodes);
    const alexanderIntegration = calculateAlexanderIntegration(nodes);
    const connectivity = calculateConnectivity(nodes);

    // Build issues list
    const issues: NetworkReport['issues'] = [];

    // Critical issues
    if (orphans.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'orphans',
        description: `${orphans.length} patterns have fewer than 3 connections`,
        affectedPatterns: orphans.map(o => o.id),
      });
    }

    if (deadRefs.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'dead-references',
        description: `${deadRefs.length} connections point to non-existent patterns`,
        affectedPatterns: deadRefs.map(r => r.from),
      });
    }

    if (chains.floating.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'floating-patterns',
        description: `${chains.floating.length} patterns are not part of any vertical chain`,
        affectedPatterns: chains.floating,
      });
    }

    // Advisory issues
    if (hubs.length > 0) {
      issues.push({
        severity: 'advisory',
        type: 'hubs',
        description: `${hubs.length} patterns have more than 8 connections`,
        affectedPatterns: hubs.map(h => h.id),
      });
    }

    if (scaleIsolated.length > 0) {
      issues.push({
        severity: 'advisory',
        type: 'scale-isolated',
        description: `${scaleIsolated.length} patterns only connect to their own scale`,
        affectedPatterns: scaleIsolated.map(s => s.id),
      });
    }

    if (chains.broken.length > 10) {
      issues.push({
        severity: 'advisory',
        type: 'broken-chains',
        description: `${chains.broken.length} vertical chains are incomplete`,
        affectedPatterns: chains.broken.flatMap(c => [...c.neighborhood, ...c.building, ...c.construction]),
      });
    }

    const isolatedClusters = clusters.filter(c => c.isolated);
    if (isolatedClusters.length > 0) {
      issues.push({
        severity: 'advisory',
        type: 'isolated-clusters',
        description: `${isolatedClusters.length} category clusters are relatively isolated`,
        affectedPatterns: isolatedClusters.flatMap(c => c.patterns),
      });
    }

    // Determine verdict
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const advisoryCount = issues.filter(i => i.severity === 'advisory').length;

    let verdict: NetworkReport['verdict'];
    if (criticalCount > 0) {
      verdict = 'CRITICAL';
    } else if (advisoryCount > 0) {
      verdict = 'ISSUES';
    } else {
      verdict = 'HEALTHY';
    }

    // Build report
    const report: NetworkReport = {
      timestamp: new Date().toISOString(),
      totalPatterns: patterns.length,
      connectivity: {
        totalConnections: connectivity.totalConnections,
        averagePerPattern: connectivity.averagePerPattern,
        orphans: orphans.map(o => ({ id: o.id, name: o.name, connections: o.connectionCount })),
        hubs: hubs.map(h => ({ id: h.id, name: h.name, connections: h.connectionCount })),
      },
      scaleFlow: {
        neighborhoodToBuilding: scaleFlow.neighborhoodToBuilding,
        buildingToConstruction: scaleFlow.buildingToConstruction,
        scaleIsolated,
      },
      verticalChains: {
        complete: chains.complete,
        broken: chains.broken,
        floating: chains.floating,
      },
      categoryBalance: {
        distribution: categoryDist,
        balanceScore,
      },
      reciprocity,
      clusters,
      alexanderIntegration,
      deadReferences: deadRefs,
      verdict,
      criticalCount,
      advisoryCount,
      issues,
    };

    // Output
    if (options.output === 'json') {
      console.log(formatReportAsJson(report));
    } else if (options.summary) {
      console.log(formatSummaryReport(report));
    } else if (options.focus && Array.isArray(options.focus)) {
      console.log(formatFocusReport(report, options.focus, nodes));
    } else {
      console.log(formatNetworkReport(report, nodes));
    }

    // Save report
    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportsDir, `network-report-${date}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    if (options.output !== 'json') {
      console.log(chalk.gray(`\nReport saved: ${reportPath}`));
    }

    // Exit code based on verdict
    if (verdict === 'CRITICAL') {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
