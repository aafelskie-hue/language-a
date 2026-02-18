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

console.log('=== FIXING REMAINING BIDIRECTIONAL ISSUES ===\n');

// Pattern 7 corrections:
// - 35, 38, 141, 180, 184, 204 have 7 in connections_down (7 is below them)
//   So 7 should have these in connections_up (they are above 7)
// - 170 has 7 in connections_up (7 is above 170)
//   So 7 should have 170 in connections_down (170 is below 7)

// First, remove the incorrect additions from the previous fix
console.log('Correcting pattern 7...');

// Remove incorrect entries from pattern 7's connections_down
lookup[7].connections_down = lookup[7].connections_down.filter(id =>
  ![35, 38, 141, 180, 184, 204].includes(id)
);

// Remove incorrect entry from pattern 7's connections_up
lookup[7].connections_up = lookup[7].connections_up.filter(id => id !== 170);

// Now add the correct reciprocals:
// 35, 38, 141, 180, 184, 204 should be in pattern 7's connections_up
console.log('Adding 35, 38, 141, 180, 184, 204 to pattern 7 connections_up');
[35, 38, 141, 180, 184, 204].forEach(id => {
  if (!lookup[7].connections_up.includes(id)) {
    lookup[7].connections_up.push(id);
  }
});

// 170 should be in pattern 7's connections_down
console.log('Adding 170 to pattern 7 connections_down');
if (!lookup[7].connections_down.includes(170)) {
  lookup[7].connections_down.push(170);
}

// Sort connections for consistency
patterns.forEach(p => {
  p.connections_up.sort((a, b) => a - b);
  p.connections_down.sort((a, b) => a - b);
});

// Save
fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
console.log('\nPatterns saved.\n');

// === VERIFICATION ===

// Check for overlapping pairs
console.log('=== OVERLAP VERIFICATION ===');
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
    }
  });
});
console.log(`Overlapping pairs: ${overlappingPairs.length}`);

// Check for self-references
console.log('\n=== SELF-REFERENCE CHECK ===');
let selfRefs = 0;
patterns.forEach(p => {
  if (p.connections_up.includes(p.id)) {
    console.log(`  Self-ref in connections_up: ${p.id}`);
    selfRefs++;
  }
  if (p.connections_down.includes(p.id)) {
    console.log(`  Self-ref in connections_down: ${p.id}`);
    selfRefs++;
  }
});
console.log(`Self-references: ${selfRefs}`);

// Bidirectional audit
console.log('\n=== BIDIRECTIONAL AUDIT ===');
let deadReferences = 0;

patterns.forEach(p => {
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

console.log(`Dead/missing reciprocal references: ${deadReferences}`);

// Summary
console.log('\n=== FINAL SUMMARY ===');
console.log(`Overlapping pairs: ${overlappingPairs.length}`);
console.log(`Self-references: ${selfRefs}`);
console.log(`Dead references: ${deadReferences}`);

if (overlappingPairs.length === 0 && selfRefs === 0 && deadReferences === 0) {
  console.log('\n✓ All integrity checks passed!');
} else {
  console.log('\n✗ Issues remain.');
}
