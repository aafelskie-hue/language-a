/**
 * Reading Order Assignment
 * Assigns reading_order (1-253) to each pattern in patterns.json
 * Creates a front-to-back reading sequence from neighborhood to construction scale
 */

import * as fs from 'fs';
import * as path from 'path';
import { PatternInput, Scale } from '../network-checker/types';
import { scorePatterns, groupByScale, ScoredPattern } from './scorer';
import { sortWithClusterAffinity, assignReadingOrder } from './sorter';
import { validateReadingOrder, PatternWithOrder } from './validator';
import { generateManifest, generateValidationReport } from './formatter';

const patternsPath = path.join(__dirname, '..', '..', 'data', 'patterns.json');
const manifestPath = path.join(
  __dirname,
  '..',
  '..',
  'data',
  'reading-order-manifest.txt'
);
const validationPath = path.join(
  __dirname,
  '..',
  '..',
  'data',
  'reading-order-validation.txt'
);

function main() {
  console.log('=== Reading Order Assignment ===\n');

  // Load patterns
  const patterns: PatternInput[] = JSON.parse(
    fs.readFileSync(patternsPath, 'utf8')
  );
  console.log(`Loaded ${patterns.length} patterns`);

  // Group by scale
  const groups = groupByScale(patterns);
  console.log(`- Neighborhood: ${groups.neighborhood.length}`);
  console.log(`- Building: ${groups.building.length}`);
  console.log(`- Construction: ${groups.construction.length}`);
  console.log('');

  // Score each scale group
  const scoredGroups: Record<Scale, ScoredPattern[]> = {
    neighborhood: scorePatterns(groups.neighborhood),
    building: scorePatterns(groups.building),
    construction: scorePatterns(groups.construction),
  };

  // Sort each scale with cluster affinity
  const sortedGroups: Record<Scale, ScoredPattern[]> = {
    neighborhood: sortWithClusterAffinity(scoredGroups.neighborhood),
    building: sortWithClusterAffinity(scoredGroups.building),
    construction: sortWithClusterAffinity(scoredGroups.construction),
  };

  // Log score ranges for each scale
  console.log('Context score ranges:');
  for (const scale of ['neighborhood', 'building', 'construction'] as Scale[]) {
    const scores = sortedGroups[scale].map(sp => sp.contextScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    console.log(`- ${scale}: ${min} to ${max}`);
  }
  console.log('');

  // Assign reading order
  const orderMap = assignReadingOrder(
    sortedGroups.neighborhood,
    sortedGroups.building,
    sortedGroups.construction
  );

  // Update patterns with reading_order
  const updatedPatterns: PatternWithOrder[] = patterns.map(p => ({
    ...p,
    reading_order: orderMap.get(p.id)!,
  }));

  // Sort patterns by reading_order for clean output
  updatedPatterns.sort((a, b) => a.reading_order - b.reading_order);

  // Validate
  const validation = validateReadingOrder(updatedPatterns);

  console.log('Validation results:');
  console.log(`- Overall valid: ${validation.valid ? 'YES' : 'NO'}`);
  console.log(
    `- Forward reference ratio: ${(validation.forwardReferenceRatio.ratio * 100).toFixed(1)}% (target: 70%)`
  );
  console.log(
    `- Cross-scale violations: ${validation.crossScaleDirection.violations.length}`
  );
  console.log('');

  // Write updated patterns.json (sorted by ID, not reading_order)
  const outputPatterns = [...updatedPatterns].sort((a, b) => a.id - b.id);
  fs.writeFileSync(patternsPath, JSON.stringify(outputPatterns, null, 2));
  console.log(`Updated ${patternsPath}`);

  // Write manifest
  const manifest = generateManifest(updatedPatterns);
  fs.writeFileSync(manifestPath, manifest);
  console.log(`Generated ${manifestPath}`);

  // Write validation report
  const report = generateValidationReport(validation, sortedGroups);
  fs.writeFileSync(validationPath, report);
  console.log(`Generated ${validationPath}`);

  console.log('\n=== Complete ===');

  // Show top patterns from each scale
  console.log('\nFirst 3 patterns by reading order:');
  for (const scale of ['neighborhood', 'building', 'construction'] as Scale[]) {
    const first = sortedGroups[scale].slice(0, 3);
    console.log(`\n${scale.toUpperCase()}:`);
    for (const sp of first) {
      const order = orderMap.get(sp.pattern.id);
      console.log(
        `  ${order}. [${sp.pattern.id}] ${sp.pattern.name} (score: ${sp.contextScore})`
      );
    }
  }
}

main();
