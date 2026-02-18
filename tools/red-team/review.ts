#!/usr/bin/env npx tsx
/**
 * Red Team Agent CLI
 * Main entry point for pattern review
 */

import 'dotenv/config';
import { Command } from 'commander';
import { parsePatternFromJson, parsePatternFromMarkdown } from './parser.js';
import { reviewPattern } from './api.js';
import { formatReviewResult, formatAsJson } from './formatter.js';
import { runBatchReview } from './batch.js';
import type { PatternInput, ReviewOptions } from './types.js';

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('red-team')
  .description('Language A Pattern Red Team Review Agent')
  .version('1.0.0');

program
  .argument('[file]', 'Path to pattern markdown file')
  .option('--id <number>', 'Pattern ID to review from JSON catalog', parseInt)
  .option('--json', 'Load pattern from JSON catalog (use with --id)')
  .option('--batch <path>', 'Batch review mode: path to patterns.json or directory')
  .option('--strict', 'Strict mode: all dimensions must pass for PUBLISH')
  .option('--output <format>', 'Output format: terminal or json', 'terminal')
  .option('--summary', 'Show summary only in batch mode')
  .option('--compare', 'Include overlap analysis with connected patterns')
  .action(async (file: string | undefined, options: ReviewOptions) => {
    try {
      // Batch mode
      if (options.batch) {
        await runBatchReview(options.batch, {
          strict: options.strict,
          outputFormat: options.output as 'terminal' | 'json',
          summaryOnly: options.summary,
        });
        return;
      }

      // Single pattern mode
      let pattern: PatternInput | null = null;

      if (options.id !== undefined) {
        // Load from JSON by ID
        pattern = parsePatternFromJson(options.id);
        if (!pattern) {
          console.error(`Pattern ${options.id} not found in catalog`);
          process.exit(1);
        }
      } else if (file) {
        // Load from markdown file
        pattern = parsePatternFromMarkdown(file);
        if (!pattern) {
          console.error(`Failed to parse pattern from ${file}`);
          process.exit(1);
        }
      } else {
        console.error('Please provide a pattern file or use --id to specify a pattern');
        program.help();
        process.exit(1);
      }

      console.log(`Reviewing Pattern ${pattern.id}: ${pattern.name}...`);

      const result = await reviewPattern(pattern, {
        strict: options.strict,
        compare: options.compare,
      });

      // Output result
      if (options.output === 'json') {
        console.log(formatAsJson(result));
      } else {
        console.log(formatReviewResult(result));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
