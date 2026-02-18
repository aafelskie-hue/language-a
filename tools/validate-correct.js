#!/usr/bin/env node
const patterns = require('../data/patterns.json');
const allIds = new Set(patterns.map(p => p.id));

console.log('=== CORRECT VALIDATION ===\n');

// Check for dead references (connections pointing to non-existent patterns)
let deadRefs = 0;
patterns.forEach(p => {
  (p.connections_up || []).forEach(id => {
    if (!allIds.has(id)) {
      deadRefs++;
      console.log('Dead ref:', p.id, 'connections_up ->', id);
    }
  });
  (p.connections_down || []).forEach(id => {
    if (!allIds.has(id)) {
      deadRefs++;
      console.log('Dead ref:', p.id, 'connections_down ->', id);
    }
  });
});
console.log('Total dead references:', deadRefs);

// Check for overlapping pairs (same pattern in both up and down)
let overlaps = 0;
patterns.forEach(p => {
  const up = new Set(p.connections_up || []);
  const down = new Set(p.connections_down || []);
  up.forEach(id => {
    if (down.has(id)) {
      overlaps++;
      console.log('Overlap:', p.id, 'has', id, 'in both up and down');
    }
  });
});
console.log('Total overlapping pairs:', overlaps);

// Check self-references
let selfRefs = 0;
patterns.forEach(p => {
  if ((p.connections_up || []).includes(p.id)) {
    selfRefs++;
    console.log('Self-ref:', p.id, 'in connections_up');
  }
  if ((p.connections_down || []).includes(p.id)) {
    selfRefs++;
    console.log('Self-ref:', p.id, 'in connections_down');
  }
});
console.log('Total self-references:', selfRefs);

// Check reading order
const orders = patterns.map(p => p.reading_order).sort((a,b) => a-b);
const expected = Array.from({length: 253}, (_, i) => i + 1);
const valid = JSON.stringify(orders) === JSON.stringify(expected);
console.log('Reading order sequential 1-253:', valid ? 'YES' : 'NO');

// Check pattern 50 and 254
const p50 = patterns.find(p => p.id === 50);
const p254 = patterns.find(p => p.id === 254);
console.log('Pattern 50 exists:', p50 ? 'YES - ' + p50.name : 'NO');
console.log('Pattern 254 exists:', p254 ? 'YES (should be gone)' : 'NO (correct)');

// Check references to 254 in connections
let refs254 = 0;
patterns.forEach(p => {
  if ((p.connections_up || []).includes(254)) refs254++;
  if ((p.connections_down || []).includes(254)) refs254++;
});
console.log('References to 254 in connections:', refs254);

// Check solutions starting with Therefore
let therefore = 0;
patterns.forEach(p => {
  if (p.solution && /^therefore/i.test(p.solution.trim())) {
    therefore++;
    console.log('Therefore:', p.id, p.name);
  }
});
console.log('Solutions starting with Therefore:', therefore);

console.log('\n=== SUMMARY ===');
const allGood = deadRefs === 0 && overlaps === 0 && selfRefs === 0 && valid && p50 && !p254 && refs254 === 0 && therefore === 0;
console.log('All checks pass:', allGood ? 'YES' : 'NO');
