#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');
const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));

// Build lookup
const lookup = {};
patterns.forEach(p => {
  lookup[p.id] = p;
});

// Scale hierarchy: neighborhood > building > construction
const scaleRank = {
  'neighborhood': 3,
  'building': 2,
  'construction': 1
};

// Category hierarchies by scale (higher number = more contextual = "up")
// Complete hierarchies based on actual data
const categoryRank = {
  neighborhood: {
    'foundation': 18,
    'fifteen-minute-life': 17,
    'community-governance': 16,
    'housing-diversity': 15,
    'density-done-right': 14,
    'adaptive-reuse': 13,
    'climate-resilience': 12,
    'energy-envelope': 11,
    'children-play': 10,
    'aging-accessibility': 9,
    'health-biophilia': 8,
    'food-water': 7,
    'water-infrastructure': 6,
    'the-commons': 5,
    'sound-silence': 4,
    'northern-living': 3,
    'construction-making': 2
  },
  building: {
    'foundation': 19,
    'housing-diversity': 18,
    'energy-envelope': 17,
    'climate-resilience': 16,
    'health-biophilia': 15,
    'light-darkness': 14,
    'sound-silence': 13,
    'digital-age-dwelling': 12,
    'adaptive-reuse': 11,
    'aging-accessibility': 10,
    'children-play': 9,
    'northern-living': 8,
    'food-water': 7,
    'water-infrastructure': 6,
    'fifteen-minute-life': 5,
    'community-governance': 4,
    'construction-making': 3,
    'the-commons': 2,
    'density-done-right': 1
  },
  construction: {
    'foundation': 15,
    'construction-making': 14,
    'water-infrastructure': 13,
    'energy-envelope': 12,
    'climate-resilience': 11,
    'northern-living': 10,
    'health-biophilia': 9,
    'light-darkness': 8,
    'sound-silence': 7,
    'adaptive-reuse': 6,
    'food-water': 5,
    'digital-age-dwelling': 4,
    'density-done-right': 3,
    'aging-accessibility': 2
  }
};

// Find all overlapping pairs
function findOverlappingPairs() {
  const pairs = [];
  const seen = new Set();

  patterns.forEach(p => {
    const up = new Set(p.connections_up || []);
    const down = new Set(p.connections_down || []);

    up.forEach(otherId => {
      if (down.has(otherId)) {
        const key = [Math.min(p.id, otherId), Math.max(p.id, otherId)].join('-');
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({
            idA: Math.min(p.id, otherId),
            idB: Math.max(p.id, otherId)
          });
        }
      }
    });
  });

  return pairs;
}

// Classify a pair
function classifyPair(idA, idB) {
  const pA = lookup[idA];
  const pB = lookup[idB];

  if (pA.scale !== pB.scale) {
    return 'cross-scale';
  } else if (pA.category !== pB.category) {
    return 'same-scale-different-category';
  } else {
    return 'same-scale-same-category';
  }
}

// Determine which pattern should be "up" (returns the id that should be up)
function determineUpPattern(idA, idB, classification) {
  const pA = lookup[idA];
  const pB = lookup[idB];

  if (classification === 'cross-scale') {
    // Larger scale is up
    return scaleRank[pA.scale] > scaleRank[pB.scale] ? idA : idB;
  } else if (classification === 'same-scale-different-category') {
    // More contextual category is up
    const rankA = categoryRank[pA.scale][pA.category] || 0;
    const rankB = categoryRank[pB.scale][pB.category] || 0;
    return rankA > rankB ? idA : idB;
  }

  return null; // same-scale-same-category - can't determine
}

// Fix a pair: upId should be in downId's connections_up, downId should be in upId's connections_down
function fixPair(upId, downId) {
  const upPattern = lookup[upId];
  const downPattern = lookup[downId];

  // Ensure upId is in downPattern's connections_up (and NOT in connections_down)
  if (!downPattern.connections_up.includes(upId)) {
    downPattern.connections_up.push(upId);
  }
  downPattern.connections_down = downPattern.connections_down.filter(id => id !== upId);

  // Ensure downId is in upPattern's connections_down (and NOT in connections_up)
  if (!upPattern.connections_down.includes(downId)) {
    upPattern.connections_down.push(downId);
  }
  upPattern.connections_up = upPattern.connections_up.filter(id => id !== downId);
}

// Main execution
console.log('=== FIXING CONNECTION DIRECTIONALITY OVERLAPS ===\n');

const allPairs = findOverlappingPairs();
console.log(`Total overlapping pairs before fixes: ${allPairs.length}\n`);

// Classify all pairs
const crossScale = [];
const sameScaleDiffCat = [];
const sameScaleSameCat = [];

allPairs.forEach(pair => {
  const classification = classifyPair(pair.idA, pair.idB);
  if (classification === 'cross-scale') {
    crossScale.push(pair);
  } else if (classification === 'same-scale-different-category') {
    sameScaleDiffCat.push(pair);
  } else {
    sameScaleSameCat.push(pair);
  }
});

console.log(`Cross-scale pairs: ${crossScale.length}`);
console.log(`Same-scale, different-category pairs: ${sameScaleDiffCat.length}`);
console.log(`Same-scale, same-category pairs: ${sameScaleSameCat.length}\n`);

// PASS 1: Fix cross-scale pairs
console.log('=== PASS 1: CROSS-SCALE (applying scale hierarchy) ===');
let pass1Fixed = 0;
crossScale.forEach(pair => {
  const upId = determineUpPattern(pair.idA, pair.idB, 'cross-scale');
  const downId = upId === pair.idA ? pair.idB : pair.idA;
  fixPair(upId, downId);
  pass1Fixed++;
});
console.log(`Fixed ${pass1Fixed} cross-scale pairs.\n`);

// PASS 2: Fix same-scale, different-category pairs
console.log('=== PASS 2: SAME-SCALE, DIFFERENT-CATEGORY (applying category hierarchy) ===');
let pass2Fixed = 0;
let pass2Warnings = [];
sameScaleDiffCat.forEach(pair => {
  const pA = lookup[pair.idA];
  const pB = lookup[pair.idB];
  const rankA = categoryRank[pA.scale][pA.category];
  const rankB = categoryRank[pB.scale][pB.category];

  if (rankA === undefined || rankB === undefined) {
    pass2Warnings.push(`Warning: Missing category rank for ${pA.id} (${pA.category}) or ${pB.id} (${pB.category}) at scale ${pA.scale}`);
    return;
  }

  if (rankA === rankB) {
    pass2Warnings.push(`Warning: Equal ranks for ${pA.id} and ${pB.id}`);
    return;
  }

  const upId = determineUpPattern(pair.idA, pair.idB, 'same-scale-different-category');
  const downId = upId === pair.idA ? pair.idB : pair.idA;
  fixPair(upId, downId);
  pass2Fixed++;
});
console.log(`Fixed ${pass2Fixed} same-scale, different-category pairs.`);
if (pass2Warnings.length > 0) {
  console.log('Warnings:');
  pass2Warnings.forEach(w => console.log(`  ${w}`));
}
console.log();

// PASS 3: Report same-scale, same-category pairs
console.log('=== PASS 3: SAME-SCALE, SAME-CATEGORY (for human review) ===');
console.log(`\n${sameScaleSameCat.length} pairs require human judgment:\n`);
console.log('ID_A\tNAME_A\tID_B\tNAME_B\tSCALE\tCATEGORY');
sameScaleSameCat.forEach(pair => {
  const pA = lookup[pair.idA];
  const pB = lookup[pair.idB];
  console.log(`${pA.id}\t${pA.name}\t${pB.id}\t${pB.name}\t${pA.scale}\t${pA.category}`);
});

// Verify remaining overlaps
console.log('\n=== VERIFICATION ===');
const remainingPairs = findOverlappingPairs();
console.log(`Overlapping pairs after fixes: ${remainingPairs.length}`);

// Sort connections for consistency
patterns.forEach(p => {
  p.connections_up.sort((a, b) => a - b);
  p.connections_down.sort((a, b) => a - b);
});

// Save
fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
console.log('\nPatterns saved to patterns.json');
