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

// All 82 directionality decisions: [upId, downId]
const decisions = [
  // NEIGHBORHOOD / FIFTEEN-MINUTE-LIFE
  [1, 4],   // 1 UP, 4 DOWN
  [4, 2],   // 2 DOWN, 4 UP

  // BUILDING / DIGITAL-AGE-DWELLING
  [6, 7],   // 6 UP, 7 DOWN
  [9, 7],   // 7 DOWN, 9 UP
  [10, 7],  // 7 DOWN, 10 UP
  [9, 8],   // 8 DOWN, 9 UP
  [11, 8],  // 8 DOWN, 11 UP
  [10, 9],  // 9 DOWN, 10 UP

  // BUILDING / HOUSING-DIVERSITY
  [12, 13], // 12 UP, 13 DOWN
  [13, 14], // 13 UP, 14 DOWN
  [15, 14], // 14 DOWN, 15 UP

  // BUILDING / CLIMATE-RESILIENCE
  [17, 19], // 17 UP, 19 DOWN
  [18, 19], // 18 UP, 19 DOWN

  // BUILDING / ENERGY-ENVELOPE
  [22, 23],  // 22 UP, 23 DOWN
  [126, 121], // 121 DOWN, 126 UP
  [127, 121], // 121 DOWN, 127 UP
  [126, 127], // 126 UP, 127 DOWN
  [126, 194], // 126 UP, 194 DOWN

  // BUILDING / FOOD-WATER
  [25, 24], // 24 DOWN, 25 UP

  // NEIGHBORHOOD / ADAPTIVE-REUSE
  [29, 203], // 29 UP, 203 DOWN
  [203, 205], // 203 UP, 205 DOWN

  // BUILDING / HEALTH-BIOPHILIA
  [30, 33], // 30 UP, 33 DOWN

  // BUILDING / FOUNDATION
  [38, 34], // 34 DOWN, 38 UP
  [34, 39], // 34 UP, 39 DOWN
  [36, 213], // 36 UP, 213 DOWN

  // NEIGHBORHOOD / FOUNDATION
  [40, 41], // 40 UP, 41 DOWN
  [41, 42], // 41 UP, 42 DOWN
  [43, 44], // 43 UP, 44 DOWN

  // CONSTRUCTION / FOUNDATION
  [45, 46], // 45 UP, 46 DOWN
  [45, 47], // 45 UP, 47 DOWN
  [46, 47], // 46 UP, 47 DOWN
  [49, 47], // 47 DOWN, 49 UP

  // NEIGHBORHOOD / COMMUNITY-GOVERNANCE
  [219, 52], // 52 DOWN, 219 UP
  [219, 53], // 53 DOWN, 219 UP

  // CONSTRUCTION / CONSTRUCTION-MAKING
  [54, 55],  // 54 UP, 55 DOWN
  [54, 56],  // 54 UP, 56 DOWN
  [54, 105], // 54 UP, 105 DOWN
  [56, 55],  // 55 DOWN, 56 UP
  [101, 55], // 55 DOWN, 101 UP
  [105, 55], // 55 DOWN, 105 UP
  [106, 55], // 55 DOWN, 106 UP
  [104, 105], // 104 UP, 105 DOWN
  [104, 106], // 104 UP, 106 DOWN

  // NEIGHBORHOOD / NORTHERN-LIVING
  [58, 60], // 58 UP, 60 DOWN

  // CONSTRUCTION / NORTHERN-LIVING
  [151, 62], // 62 DOWN, 151 UP
  [62, 152], // 62 UP, 152 DOWN
  [64, 63],  // 63 DOWN, 64 UP
  [147, 63], // 63 DOWN, 147 UP
  [64, 233], // 64 UP, 233 DOWN
  [151, 152], // 151 UP, 152 DOWN

  // BUILDING / WATER-INFRASTRUCTURE
  [70, 65], // 65 DOWN, 70 UP
  [70, 66], // 66 DOWN, 70 UP

  // NEIGHBORHOOD / CHILDREN-PLAY
  [72, 71], // 71 DOWN, 72 UP
  [71, 75], // 71 UP, 75 DOWN
  [71, 241], // 71 UP, 241 DOWN
  [72, 76], // 72 UP, 76 DOWN

  // BUILDING / CHILDREN-PLAY
  [73, 74], // 73 UP, 74 DOWN

  // NEIGHBORHOOD / AGING-ACCESSIBILITY
  [77, 78], // 77 UP, 78 DOWN
  [77, 79], // 77 UP, 79 DOWN

  // BUILDING / LIGHT-DARKNESS
  [86, 82], // 82 DOWN, 86 UP
  [86, 83], // 83 DOWN, 86 UP

  // NEIGHBORHOOD / THE-COMMONS
  [91, 92], // 91 UP, 92 DOWN

  // NEIGHBORHOOD / DENSITY-DONE-RIGHT
  [96, 97], // 96 UP, 97 DOWN

  // BUILDING / DENSITY-DONE-RIGHT
  [166, 99],  // 99 DOWN, 166 UP
  [99, 176],  // 99 UP, 176 DOWN
  [166, 170], // 166 UP, 170 DOWN
  [166, 176], // 166 UP, 176 DOWN
  [176, 170], // 170 DOWN, 176 UP

  // NEIGHBORHOOD / CLIMATE-RESILIENCE
  [116, 187], // 116 UP, 187 DOWN
  [187, 119], // 119 DOWN, 187 UP

  // CONSTRUCTION / ENERGY-ENVELOPE
  [129, 128], // 128 DOWN, 129 UP
  [130, 128], // 128 DOWN, 130 UP
  [128, 155], // 128 UP, 155 DOWN
  [128, 157], // 128 UP, 157 DOWN
  [129, 130], // 129 UP, 130 DOWN
  [129, 155], // 129 UP, 155 DOWN
  [130, 155], // 130 UP, 155 DOWN
  [130, 157], // 130 UP, 157 DOWN

  // CONSTRUCTION / ADAPTIVE-REUSE
  [207, 143], // 143 DOWN, 207 UP

  // BUILDING / AGING-ACCESSIBILITY
  [171, 172], // 171 UP, 172 DOWN
  [171, 248], // 171 UP, 248 DOWN
  [248, 172], // 172 DOWN, 248 UP
];

console.log(`Applying ${decisions.length} directionality decisions...\n`);

// Apply each decision
decisions.forEach(([upId, downId]) => {
  const upPattern = lookup[upId];
  const downPattern = lookup[downId];

  if (!upPattern || !downPattern) {
    console.log(`WARNING: Missing pattern ${upId} or ${downId}`);
    return;
  }

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
});

// Sort connections for consistency
patterns.forEach(p => {
  p.connections_up.sort((a, b) => a - b);
  p.connections_down.sort((a, b) => a - b);
});

// Save
fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
console.log('Patterns saved.\n');

// Verification 1: Check for remaining overlaps
console.log('=== OVERLAP VERIFICATION ===');
let overlapCount = 0;
const overlappingPairs = [];

patterns.forEach(p => {
  const up = new Set(p.connections_up || []);
  const down = new Set(p.connections_down || []);

  up.forEach(otherId => {
    if (down.has(otherId)) {
      const key = [Math.min(p.id, otherId), Math.max(p.id, otherId)].join('-');
      if (!overlappingPairs.includes(key)) {
        overlappingPairs.push(key);
        console.log(`  Overlap: ${p.id} <-> ${otherId}`);
      }
      overlapCount++;
    }
  });
});

console.log(`\nOverlapping pairs remaining: ${overlappingPairs.length}`);

// Verification 2: Bidirectional audit
console.log('\n=== BIDIRECTIONAL AUDIT ===');
let deadReferences = 0;

patterns.forEach(p => {
  // For each pattern in connections_up, check that we're in their connections_down
  p.connections_up.forEach(upId => {
    const upPattern = lookup[upId];
    if (!upPattern) {
      console.log(`  Dead reference: ${p.id} -> ${upId} (pattern doesn't exist)`);
      deadReferences++;
      return;
    }
    if (!upPattern.connections_down.includes(p.id)) {
      console.log(`  Missing reciprocal: ${p.id} has ${upId} in connections_up, but ${upId} doesn't have ${p.id} in connections_down`);
      deadReferences++;
    }
  });

  // For each pattern in connections_down, check that we're in their connections_up
  p.connections_down.forEach(downId => {
    const downPattern = lookup[downId];
    if (!downPattern) {
      console.log(`  Dead reference: ${p.id} -> ${downId} (pattern doesn't exist)`);
      deadReferences++;
      return;
    }
    if (!downPattern.connections_up.includes(p.id)) {
      console.log(`  Missing reciprocal: ${p.id} has ${downId} in connections_down, but ${downId} doesn't have ${p.id} in connections_up`);
      deadReferences++;
    }
  });
});

console.log(`\nDead/missing reciprocal references: ${deadReferences}`);

// Summary
console.log('\n=== FINAL SUMMARY ===');
console.log(`Overlapping pairs: ${overlappingPairs.length}`);
console.log(`Dead references: ${deadReferences}`);
