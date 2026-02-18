#!/usr/bin/env node
/**
 * Pattern Generator CLI
 * Main entry point for drafting Language A patterns
 */

import 'dotenv/config';
import { Command } from 'commander';
import { draftPattern } from './drafter.js';
import { revisePattern } from './reviser.js';
import { getSlotById, getSlotsByPriority, getSlotsByCategory, getSlotsByRange } from './context.js';
import {
  formatHeader,
  formatSlotInfo,
  formatGenerationResult,
  formatResearchResult,
  formatError,
  formatSuccess,
  formatInfo,
  formatDraftingStatus,
  formatUsage,
  formatProgress,
} from './formatter.js';
import type { GenerationResult } from './types.js';

const program = new Command();

program
  .name('generate')
  .description('Draft Language A patterns from catalog plan slots')
  .version('1.0.0');

// Single pattern options
program
  .option('--id <number>', 'Pattern ID from catalog plan', parseInt)
  .option('--research', 'Search for evidence before drafting')
  .option('--context <text>', "Andrew's notes to include in prompt")
  .option('--gate', 'Run quality gate after drafting');

// Revision options
program
  .option('--revise <path>', 'Revise an existing draft')
  .option('--feedback <text>', 'Feedback to address in revision');

// Batch options
program
  .option('--batch', 'Enable batch generation mode')
  .option('--priority <level>', 'Filter by priority (high/medium/low)')
  .option('--category <id>', 'Filter by category ID')
  .option('--from <number>', 'Start of ID range', parseInt)
  .option('--to <number>', 'End of ID range', parseInt)
  .option('--auto-revise <n>', 'Auto-revise up to n times', parseInt);

// Output options
program
  .option('--output <format>', 'Output format: terminal or json', 'terminal')
  .option('--quiet', 'Suppress progress output');

program.parse();

const options = program.opts();

async function main(): Promise<void> {
  // Handle revision mode
  if (options.revise) {
    await handleRevision();
    return;
  }

  // Handle batch mode
  if (options.batch) {
    await handleBatch();
    return;
  }

  // Handle single pattern mode
  if (options.id) {
    await handleSingle();
    return;
  }

  // No valid mode specified
  console.log(formatUsage());
  process.exit(1);
}

/**
 * Handle single pattern generation
 */
async function handleSingle(): Promise<void> {
  const patternId = options.id;
  const slot = getSlotById(patternId);

  if (!slot) {
    console.error(formatError(`Pattern ${patternId} not found in catalog plan`));
    process.exit(1);
  }

  if (options.output !== 'json' && !options.quiet) {
    console.log(formatHeader('Pattern Generator'));
    console.log(formatSlotInfo(slot));
    console.log('');
  }

  try {
    if (!options.quiet) {
      console.log(formatDraftingStatus(slot.name, options.research ? 'researching...' : 'drafting...'));
    }

    const result = await draftPattern(patternId, {
      andrewContext: options.context,
      useResearch: options.research,
    });

    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('');
      console.log(formatGenerationResult(result));
      console.log('');
      console.log(formatSuccess(`Draft saved to: ${result.draftPath}`));
    }

    // Run quality gate if requested
    if (options.gate) {
      if (!options.quiet) {
        console.log('');
        console.log(formatInfo('Quality gate not yet implemented in this version'));
      }
    }
  } catch (error) {
    console.error(formatError(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Handle revision mode
 */
async function handleRevision(): Promise<void> {
  const draftPath = options.revise;
  const feedback = options.feedback;

  if (!feedback) {
    console.error(formatError('--feedback required when using --revise'));
    process.exit(1);
  }

  if (options.output !== 'json' && !options.quiet) {
    console.log(formatHeader('Pattern Revision'));
    console.log(formatInfo(`Revising: ${draftPath}`));
    console.log(formatInfo(`Feedback: ${feedback}`));
    console.log('');
  }

  try {
    const result = await revisePattern(draftPath, feedback, {
      andrewContext: options.context,
    });

    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatGenerationResult(result));
      console.log('');
      console.log(formatSuccess(`Revised draft saved to: ${result.draftPath}`));
    }
  } catch (error) {
    console.error(formatError(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Handle batch generation
 */
async function handleBatch(): Promise<void> {
  // Get slots to process
  let slots = [];

  if (options.priority) {
    slots = getSlotsByPriority(options.priority);
  } else if (options.category) {
    slots = getSlotsByCategory(options.category);
  } else if (options.from && options.to) {
    slots = getSlotsByRange(options.from, options.to);
  } else {
    console.error(formatError('Batch mode requires --priority, --category, or --from/--to'));
    process.exit(1);
  }

  if (slots.length === 0) {
    console.error(formatError('No planned patterns found matching criteria'));
    process.exit(1);
  }

  if (options.output !== 'json' && !options.quiet) {
    console.log(formatHeader('Batch Generation'));
    console.log(formatInfo(`Found ${slots.length} patterns to generate`));
    console.log('');
  }

  const results: GenerationResult[] = [];
  const errors: { id: number; name: string; error: string }[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    if (!options.quiet) {
      console.log(formatProgress(`Drafting ${slot.name}...`, i, slots.length));
    }

    try {
      const result = await draftPattern(slot.id, {
        andrewContext: options.context,
        useResearch: options.research,
      });

      results.push(result);

      // Auto-revise loop if enabled
      if (options.autoRevise && options.autoRevise > 0) {
        // Note: Auto-revise with Red Team integration not implemented yet
        // Would require running Red Team and feeding back results
      }

      if (!options.quiet) {
        console.log(formatSuccess(`  ${slot.id}. ${slot.name} → ${result.draftPath}`));
      }
    } catch (error) {
      errors.push({
        id: slot.id,
        name: slot.name,
        error: error instanceof Error ? error.message : String(error),
      });

      if (!options.quiet) {
        console.log(formatError(`  ${slot.id}. ${slot.name}: ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    // Add small delay between API calls
    if (i < slots.length - 1) {
      await sleep(500);
    }
  }

  // Output summary
  if (options.output === 'json') {
    console.log(JSON.stringify({
      total: slots.length,
      generated: results.length,
      failed: errors.length,
      results,
      errors,
    }, null, 2));
  } else if (!options.quiet) {
    console.log('');
    console.log(formatHeader('Batch Complete'));
    console.log(formatSuccess(`Generated: ${results.length}/${slots.length}`));
    if (errors.length > 0) {
      console.log(formatError(`Failed: ${errors.length}`));
      for (const err of errors) {
        console.log(`  • ${err.id}. ${err.name}: ${err.error}`);
      }
    }
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(error => {
  console.error(formatError(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
