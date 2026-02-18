#!/usr/bin/env node
/**
 * Override Reading Order Tool
 *
 * Sets manual reading order overrides for the first 9 neighborhood patterns,
 * shifts remaining neighborhood patterns to follow, preserves building/construction order.
 */

const fs = require('fs');
const path = require('path');

// Manual override list: reading_order position -> pattern ID
const OVERRIDES = [
  { position: 1, id: 1 },   // The Fifteen-Minute Neighborhood
  { position: 2, id: 41 },  // The Identifiable Neighborhood
  { position: 3, id: 40 },  // Walkable Density Gradient
  { position: 4, id: 2 },   // The Third Place Network
  { position: 5, id: 42 },  // Common Ground
  { position: 6, id: 43 },  // The Local Street
  { position: 7, id: 44 },  // Green Corridors
  { position: 8, id: 72 },  // Safe Streets for Children
  { position: 9, id: 58 },  // The Winter City Street
];

const OVERRIDE_IDS = new Set(OVERRIDES.map(o => o.id));

function loadPatterns() {
  const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');
  return JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
}

function savePatterns(patterns) {
  const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');
  fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2) + '\n');
}

function applyOverrides(patterns) {
  // Create ID -> pattern lookup
  const byId = new Map(patterns.map(p => [p.id, p]));

  // Apply manual overrides (positions 1-9)
  for (const override of OVERRIDES) {
    const pattern = byId.get(override.id);
    if (!pattern) {
      throw new Error(`Override pattern ID ${override.id} not found`);
    }
    if (pattern.scale !== 'neighborhood') {
      throw new Error(`Override pattern ID ${override.id} is not neighborhood scale`);
    }
    pattern.reading_order = override.position;
  }

  // Get remaining neighborhood patterns (not in override list)
  const remainingNeighborhood = patterns
    .filter(p => p.scale === 'neighborhood' && !OVERRIDE_IDS.has(p.id))
    .sort((a, b) => a.reading_order - b.reading_order);

  // Assign reading_order 10-74 to remaining neighborhood patterns
  let nextOrder = 10;
  for (const pattern of remainingNeighborhood) {
    pattern.reading_order = nextOrder++;
  }

  // Building and construction patterns stay unchanged
  // (their reading_order values 75-253 are already correct)

  return patterns;
}

function validate(patterns) {
  const orders = patterns.map(p => p.reading_order).sort((a, b) => a - b);
  const expected = Array.from({ length: 253 }, (_, i) => i + 1);

  // Check for gaps
  const gaps = [];
  for (let i = 1; i <= 253; i++) {
    if (!orders.includes(i)) gaps.push(i);
  }

  // Check for duplicates
  const seen = new Set();
  const duplicates = [];
  for (const order of orders) {
    if (seen.has(order)) duplicates.push(order);
    seen.add(order);
  }

  return {
    valid: gaps.length === 0 && duplicates.length === 0,
    gaps,
    duplicates,
    total: orders.length,
    min: Math.min(...orders),
    max: Math.max(...orders)
  };
}

function calculateForwardReferenceRatio(patterns) {
  const orderById = new Map(patterns.map(p => [p.id, p.reading_order]));

  let totalRefs = 0;
  let forwardRefs = 0;

  for (const pattern of patterns) {
    const myOrder = pattern.reading_order;
    for (const upId of (pattern.connections_up || [])) {
      if (orderById.has(upId)) {
        totalRefs++;
        if (orderById.get(upId) < myOrder) {
          forwardRefs++;
        }
      }
    }
  }

  return {
    total: totalRefs,
    forward: forwardRefs,
    ratio: totalRefs > 0 ? (forwardRefs / totalRefs * 100).toFixed(1) : '0.0'
  };
}

function generateManifest(patterns) {
  const sorted = [...patterns].sort((a, b) => a.reading_order - b.reading_order);

  const lines = [
    '# Language A Reading Order Manifest',
    `# Generated: ${new Date().toISOString()}`,
    `# Total patterns: ${patterns.length}`,
    ''
  ];

  const scaleRanges = {
    neighborhood: { start: 1, end: 74, label: 'NEIGHBORHOOD SCALE' },
    building: { start: 75, end: 190, label: 'BUILDING SCALE' },
    construction: { start: 191, end: 253, label: 'CONSTRUCTION SCALE' }
  };

  for (const [scale, range] of Object.entries(scaleRanges)) {
    lines.push(`${range.label} (${range.start}-${range.end})`);

    const scalePatterns = sorted.filter(p => p.scale === scale);
    for (const p of scalePatterns) {
      const paddedOrder = String(p.reading_order).padStart(4, ' ');
      const paddedId = String(p.id).padStart(3, '0');
      lines.push(`${paddedOrder}. [ID ${paddedId}] ${p.name}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateValidation(patterns, validation, forwardRef) {
  const lines = [
    '# Language A Reading Order Validation Report',
    `# Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `Overall valid: ${validation.valid ? 'YES' : 'NO'}`,
    '',
    '## Pattern Counts by Scale'
  ];

  const scales = ['neighborhood', 'building', 'construction'];
  const ranges = [[1, 74], [75, 190], [191, 253]];

  for (let i = 0; i < scales.length; i++) {
    const count = patterns.filter(p => p.scale === scales[i]).length;
    const [start, end] = ranges[i];
    lines.push(`- ${scales[i].charAt(0).toUpperCase() + scales[i].slice(1)}: ${count} patterns (orders ${start}-${end})`);
  }

  lines.push('');
  lines.push('## Completeness Check');
  lines.push(`- Expected: 253 orders`);
  lines.push(`- Actual unique: ${validation.total} orders`);
  lines.push(`- Gaps: ${validation.gaps.length > 0 ? validation.gaps.join(', ') : 'None'}`);
  lines.push(`- Duplicates: ${validation.duplicates.length > 0 ? validation.duplicates.join(', ') : 'None'}`);
  lines.push('');
  lines.push('## Forward Reference Ratio');
  lines.push(`- Total connections_up references: ${forwardRef.total}`);
  lines.push(`- References pointing to earlier reading_order: ${forwardRef.forward}`);
  lines.push(`- Ratio: ${forwardRef.ratio}%`);
  lines.push(`- Target: 70%`);
  lines.push(`- Met: ${parseFloat(forwardRef.ratio) >= 70 ? 'YES' : 'NO'}`);
  lines.push('');
  lines.push('## Override Applied');
  lines.push('Positions 1-9 manually set, remaining neighborhood patterns shifted.');

  return lines.join('\n');
}

function printVerification(patterns) {
  const neighborhood = patterns
    .filter(p => p.scale === 'neighborhood')
    .sort((a, b) => a.reading_order - b.reading_order)
    .slice(0, 15);

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│         TOP 15 NEIGHBORHOOD PATTERNS (READING ORDER)        │');
  console.log('├─────┬─────┬───────────────────────────────────────────────────┤');
  console.log('│ Ord │ ID  │ Name                                              │');
  console.log('├─────┼─────┼───────────────────────────────────────────────────┤');

  for (const p of neighborhood) {
    const ord = String(p.reading_order).padStart(3, ' ');
    const id = String(p.id).padStart(3, ' ');
    const name = p.name.length > 49 ? p.name.slice(0, 46) + '...' : p.name.padEnd(49, ' ');
    console.log(`│ ${ord} │ ${id} │ ${name} │`);
  }

  console.log('└─────┴─────┴───────────────────────────────────────────────────┘');
}

function main() {
  console.log('Loading patterns.json...');
  const patterns = loadPatterns();

  console.log('Applying reading order overrides...');
  applyOverrides(patterns);

  console.log('Validating completeness...');
  const validation = validate(patterns);

  if (!validation.valid) {
    console.error('VALIDATION FAILED:');
    if (validation.gaps.length > 0) {
      console.error(`  Gaps: ${validation.gaps.join(', ')}`);
    }
    if (validation.duplicates.length > 0) {
      console.error(`  Duplicates: ${validation.duplicates.join(', ')}`);
    }
    process.exit(1);
  }

  console.log('Calculating forward reference ratio...');
  const forwardRef = calculateForwardReferenceRatio(patterns);

  console.log('Saving patterns.json...');
  savePatterns(patterns);

  console.log('Generating manifest...');
  const manifest = generateManifest(patterns);
  const manifestPath = path.join(__dirname, '..', 'data', 'reading-order-manifest.txt');
  fs.writeFileSync(manifestPath, manifest);

  console.log('Generating validation report...');
  const validationReport = generateValidation(patterns, validation, forwardRef);
  const validationPath = path.join(__dirname, '..', 'data', 'reading-order-validation.txt');
  fs.writeFileSync(validationPath, validationReport);

  // Print summary
  console.log('\n✓ Reading order override complete');
  console.log(`  - Patterns: ${validation.total}`);
  console.log(`  - Range: ${validation.min}-${validation.max}`);
  console.log(`  - Gaps: ${validation.gaps.length}`);
  console.log(`  - Duplicates: ${validation.duplicates.length}`);
  console.log(`  - Forward reference ratio: ${forwardRef.ratio}%`);

  printVerification(patterns);
}

main();
