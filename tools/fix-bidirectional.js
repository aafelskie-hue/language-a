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

console.log('=== FIXING BIDIRECTIONAL INTEGRITY ISSUES ===\n');

// 1. Pattern 12: Remove self-reference from connections_down
console.log('1. Pattern 12: Removing self-reference from connections_down');
lookup[12].connections_down = lookup[12].connections_down.filter(id => id !== 12);

// 2. Pattern 12: Add 51 and 52 to connections_down
console.log('2. Pattern 12: Adding 51, 52 to connections_down');
[51, 52].forEach(id => {
  if (!lookup[12].connections_down.includes(id)) {
    lookup[12].connections_down.push(id);
  }
});

// 3. Pattern 7: Add 35, 38, 180, 184, 204, 141 to connections_down
console.log('3. Pattern 7: Adding 35, 38, 141, 180, 184, 204 to connections_down');
[35, 38, 141, 180, 184, 204].forEach(id => {
  if (!lookup[7].connections_down.includes(id)) {
    lookup[7].connections_down.push(id);
  }
});

// 4. Pattern 7: Add 170 to connections_up
console.log('4. Pattern 7: Adding 170 to connections_up');
if (!lookup[7].connections_up.includes(170)) {
  lookup[7].connections_up.push(170);
}

// 5. Pattern 49: All of 27, 139, 140, 141, 142, 203, 204 have 49 in connections_up
//    So pattern 49 should have them in connections_down
console.log('5. Pattern 49: Adding 27, 139, 140, 141, 142, 203, 204 to connections_down');
[27, 139, 140, 141, 142, 203, 204].forEach(id => {
  if (!lookup[49].connections_down.includes(id)) {
    lookup[49].connections_down.push(id);
  }
});

// 6. Pattern 100: Add 54, 55, 57, 222, 227 to connections_down (they have 100 in connections_up)
console.log('6. Pattern 100: Adding 54, 55, 57, 222, 227 to connections_down');
[54, 55, 57, 222, 227].forEach(id => {
  if (!lookup[100].connections_down.includes(id)) {
    lookup[100].connections_down.push(id);
  }
});

// 7. Pattern 100: Add 52, 219, 225 to connections_up (they have 100 in connections_down)
console.log('7. Pattern 100: Adding 52, 219, 225 to connections_up');
[52, 219, 225].forEach(id => {
  if (!lookup[100].connections_up.includes(id)) {
    lookup[100].connections_up.push(id);
  }
});

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
