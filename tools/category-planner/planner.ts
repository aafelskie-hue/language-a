#!/usr/bin/env node
/**
 * Category Planner CLI
 * Analyze patterns and generate catalog plans
 */

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { analyzePatterns } from './analyzer.js';
import { loadCatalogPlan, saveCatalogPlan, saveMarkdownReport } from './parser.js';
import { generateCatalogPlan, hasApiKey } from './proposer.js';
import { validatePlan } from './validator.js';
import {
  formatAnalysisResult,
  formatValidationReport,
  formatPlanStats,
  exportAsMarkdown,
  formatProgress,
} from './formatter.js';

const program = new Command();

program
  .name('category-planner')
  .description('Analyze patterns and generate complete catalog plans for Language A')
  .version('1.0.0');

program
  .option('--analyze', 'Run gap analysis on existing patterns (no API needed)')
  .option('--plan', 'Generate full 254-pattern catalog plan (requires ANTHROPIC_API_KEY)')
  .option('--validate <file>', 'Validate an existing catalog plan file')
  .option('--stats <file>', 'Show statistics for a catalog plan file')
  .option('--export <file>', 'Export catalog plan as markdown')
  .option('--output <format>', 'Output format: terminal or json', 'terminal')
  .option('--min-per-category <n>', 'Minimum patterns per category', parseInt)
  .option('--max-per-category <n>', 'Maximum patterns per category', parseInt);

program.parse();

const options = program.opts();

async function main() {
  try {
    // Handle --analyze
    if (options.analyze) {
      console.log(chalk.cyan('\nAnalyzing existing patterns...'));
      const analysis = await analyzePatterns();

      if (options.output === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log(formatAnalysisResult(analysis));
      }
      return;
    }

    // Handle --plan
    if (options.plan) {
      if (!hasApiKey()) {
        console.error(chalk.red('\nError: ANTHROPIC_API_KEY environment variable is required for --plan mode'));
        console.error(chalk.gray('Set it in your .env file or export it before running.'));
        process.exit(1);
      }

      console.log(chalk.cyan('\nGenerating 254-pattern catalog plan...'));
      console.log(chalk.gray('This may take a few moments.\n'));

      // First run analysis
      console.log(formatProgress('Analyzing existing patterns', 1, 3));
      const analysis = await analyzePatterns();

      // Generate plan
      console.log(formatProgress('Generating catalog plan via Claude API', 2, 3));
      const slots = await generateCatalogPlan(analysis);

      // Validate
      console.log(formatProgress('Validating plan structure', 3, 3));
      const report = validatePlan(slots);

      // Save outputs
      saveCatalogPlan(slots);
      console.log(chalk.green(`\n✓ Saved catalog plan to data/catalog-plan.json`));

      const markdown = exportAsMarkdown(slots, report);
      saveMarkdownReport(markdown);
      console.log(chalk.green(`✓ Saved markdown report to docs/catalog-plan.md`));

      // Show summary
      if (options.output === 'json') {
        console.log(JSON.stringify({ slots, report }, null, 2));
      } else {
        console.log(formatValidationReport(report));
      }
      return;
    }

    // Handle --validate
    if (options.validate) {
      const slots = loadCatalogPlan(options.validate);
      if (!slots) {
        console.error(chalk.red(`\nError: Could not load plan from ${options.validate}`));
        process.exit(1);
      }

      const report = validatePlan(slots);

      if (options.output === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatValidationReport(report));
      }
      return;
    }

    // Handle --stats
    if (options.stats) {
      const slots = loadCatalogPlan(options.stats);
      if (!slots) {
        console.error(chalk.red(`\nError: Could not load plan from ${options.stats}`));
        process.exit(1);
      }

      if (options.output === 'json') {
        const stats = {
          total: slots.length,
          existing: slots.filter(s => s.status === 'existing').length,
          planned: slots.filter(s => s.status === 'planned').length,
          byPriority: {
            high: slots.filter(s => s.priority === 'high' && s.status === 'planned').length,
            medium: slots.filter(s => s.priority === 'medium' && s.status === 'planned').length,
            low: slots.filter(s => s.priority === 'low' && s.status === 'planned').length,
          },
          byScale: {
            neighborhood: slots.filter(s => s.scale === 'neighborhood').length,
            building: slots.filter(s => s.scale === 'building').length,
            construction: slots.filter(s => s.scale === 'construction').length,
          },
          coldClimate: slots.filter(s => s.coldClimate).length,
        };
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(formatPlanStats(slots));
      }
      return;
    }

    // Handle --export
    if (options.export) {
      const slots = loadCatalogPlan(options.export);
      if (!slots) {
        console.error(chalk.red(`\nError: Could not load plan from ${options.export}`));
        process.exit(1);
      }

      const report = validatePlan(slots);
      const markdown = exportAsMarkdown(slots, report);

      if (options.output === 'json') {
        console.log(JSON.stringify({ markdown }, null, 2));
      } else {
        console.log(markdown);
      }
      return;
    }

    // No command specified - show help
    console.log(chalk.bold('\nCategory Planner for Language A\n'));
    console.log('Usage:');
    console.log('  npx tsx tools/category-planner/planner.ts --analyze');
    console.log('  npx tsx tools/category-planner/planner.ts --plan');
    console.log('  npx tsx tools/category-planner/planner.ts --validate data/catalog-plan.json');
    console.log('  npx tsx tools/category-planner/planner.ts --stats data/catalog-plan.json');
    console.log('  npx tsx tools/category-planner/planner.ts --export data/catalog-plan.json');
    console.log('\nOptions:');
    console.log('  --analyze           Gap report only (no API required)');
    console.log('  --plan              Generate 254-pattern plan (requires ANTHROPIC_API_KEY)');
    console.log('  --validate <file>   Validate a plan file');
    console.log('  --stats <file>      Show plan statistics');
    console.log('  --export <file>     Export as markdown');
    console.log('  --output <format>   terminal | json');
    console.log('');

  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
