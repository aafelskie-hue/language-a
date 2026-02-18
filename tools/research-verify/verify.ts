#!/usr/bin/env npx tsx
/**
 * Research Verification Agent CLI
 * Main entry point for fact-checking pattern claims using Claude Code CLI
 */

import 'dotenv/config';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { extractClaims } from './extractor.js';
import { verifyAllClaims } from './checker.js';
import {
  formatVerificationResult,
  formatExtractedClaims,
  formatProgress,
  formatAsJson,
  generateSummary,
  determineVerdict,
} from './formatter.js';
import { runBatchVerification } from './batch.js';
import type { PatternInput, PatternVerification, VerifyOptions } from './types.js';

// Path to the patterns JSON file
const PATTERNS_PATH = path.resolve(process.cwd(), 'data/patterns.json');

/**
 * Load all patterns from the JSON catalog
 */
function loadPatternCatalog(): PatternInput[] {
  const raw = fs.readFileSync(PATTERNS_PATH, 'utf-8');
  return JSON.parse(raw) as PatternInput[];
}

/**
 * Load a single pattern by ID from the JSON catalog
 */
function parsePatternFromJson(id: number): PatternInput | null {
  const patterns = loadPatternCatalog();
  return patterns.find((p) => p.id === id) || null;
}

/**
 * Parse a pattern from a Markdown file with YAML frontmatter
 */
function parsePatternFromMarkdown(filePath: string): PatternInput | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    // Extract sections from content
    const sections = parseSections(content);

    // Validate required frontmatter fields
    if (!data.id || !data.name || !data.scale) {
      console.error(`Missing required frontmatter in ${filePath}`);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      number: String(data.id).padStart(2, '0'),
      scale: data.scale,
      category: data.category || 'uncategorized',
      categoryLabel: data.categoryLabel || data.category || 'Uncategorized',
      confidence: data.confidence ?? 1,
      status: data.status || 'candidate',
      problem: sections.problem || '',
      body: sections.context || sections.body || '',
      solution: sections.solution || '',
      connections_up: data.connections_up || [],
      connections_down: data.connections_down || [],
      tags: data.tags || [],
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse sections from markdown content
 */
function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
      }
      currentSection = headerMatch[1];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('research-verify')
  .description('Language A Pattern Research Verification Agent')
  .version('1.0.0');

program
  .argument('[file]', 'Path to pattern markdown file')
  .option('--id <number>', 'Pattern ID to verify from JSON catalog', parseInt)
  .option('--json', 'Load pattern from JSON catalog (use with --id)')
  .option('--batch <path>', 'Batch verification mode: path to patterns.json')
  .option('--strict', 'Strict mode: flags UNVERIFIED as failures')
  .option('--extract-only', 'Extract claims only, no verification')
  .option('--output <format>', 'Output format: terminal or json', 'terminal')
  .option('--summary', 'Show summary only in batch mode')
  .option('--concurrency <number>', 'Concurrent verifications (default: 1)', parseInt)
  .option('--ids <list>', 'Comma-separated list of pattern IDs to verify')
  .option('--exclude-verdicts <verdicts>', 'Skip patterns with these verdicts (e.g., CLEAN)')
  .option('--previous-report <path>', 'Path to previous report for verdict filtering')
  .option('--output-file <path>', 'Custom output file path for report')
  .action(async (file: string | undefined, options: VerifyOptions) => {
    try {
      // Batch mode
      if (options.batch) {
        // Validate --exclude-verdicts requires --previous-report
        if (options.excludeVerdicts && !options.previousReport) {
          console.error('--exclude-verdicts requires --previous-report <path>');
          process.exit(1);
        }

        // Parse --ids into number array
        let filterIds: number[] | undefined;
        if (options.ids) {
          filterIds = options.ids.split(',').map(s => parseInt(s.trim(), 10));
          // Validate all are valid numbers
          if (filterIds.some(id => isNaN(id))) {
            console.error('Invalid pattern ID in --ids list');
            process.exit(1);
          }
        }

        // Parse --exclude-verdicts into string array
        let excludeVerdicts: string[] | undefined;
        if (options.excludeVerdicts) {
          excludeVerdicts = options.excludeVerdicts.split(',').map(s => s.trim().toUpperCase());
        }

        await runBatchVerification(options.batch, {
          strict: options.strict,
          outputFormat: options.output as 'terminal' | 'json',
          summaryOnly: options.summary,
          concurrency: options.concurrency || 1,
          filterIds,
          excludeVerdicts,
          previousReport: options.previousReport,
          outputFile: options.outputFile,
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

      console.log(`\nVerifying Pattern ${pattern.id}: ${pattern.name}...`);
      console.log('');

      // Step 1: Extract claims
      process.stdout.write('Extracting claims...');
      const claims = await extractClaims(pattern);
      console.log(` found ${claims.length} claims\n`);

      // Extract-only mode
      if (options.extractOnly) {
        console.log(formatExtractedClaims(claims));
        return;
      }

      if (claims.length === 0) {
        console.log('No verifiable claims found in this pattern.');
        return;
      }

      // Step 2: Verify each claim
      const verificationResult = await verifyAllClaims(claims, {
        onProgress: (current, total) => {
          process.stdout.write(`\r${formatProgress(current, total, 'Verifying')}`);
        },
        onConnectivityPause: (action, failures) => {
          console.log(`\n[Connectivity] ${failures} consecutive failures - ${action}`);
        },
        onHalt: (signal) => {
          console.log(`\n[HALT] ${signal.reason}`);
          console.log(`Completed ${signal.completedCount}/${signal.totalCount} claims before halt`);
        },
      });

      console.log('\n');

      // Check for halt
      if (verificationResult.halted) {
        console.log('Verification halted due to connectivity issues. Resume later.');
        process.exit(2);
      }

      // Generate summary
      const summary = generateSummary(verificationResult.results, pattern.confidence);

      // Build verification result
      const verification: PatternVerification = {
        patternId: pattern.id,
        patternName: pattern.name,
        timestamp: new Date().toISOString(),
        model: 'claude-code-cli',
        totalClaims: claims.length,
        results: verificationResult.results,
        summary,
      };

      // Output result
      if (options.output === 'json') {
        console.log(formatAsJson(verification));
      } else {
        console.log(formatVerificationResult(verification));
      }

      // Exit with appropriate code
      const verdict = determineVerdict(verificationResult.results);
      if (verdict === 'FAIL') {
        process.exit(1);
      } else if (verdict === 'CAUTION' && options.strict) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
