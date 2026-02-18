/**
 * Add bidirectional back-references to patterns.json
 * For each pattern's connections_up and connections_down:
 * - Find the referenced pattern
 * - Add reciprocal reference back to the new pattern
 */

const fs = require('fs');
const path = require('path');

const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');
const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));

// Build a map of pattern IDs
const patternMap = new Map();
patterns.forEach(p => patternMap.set(p.id, p));

let backRefsAdded = 0;
let deadRefsFound = [];

// New patterns we integrated (IDs > 108 that weren't in original 156)
const newPatternIds = new Set([109,112,113,118,120,123,124,131,132,133,135,136,139,141,142,144,146,148,149,154,156,157,158,160,162,165,167,169,173,175,177,178,180,183,184,186,190,191,192,196,197,198,199,204,206,208,209,210,212,215,216,217,218,221,227,228,230,231,232,234,235,236,237,240,242,243,245,247,249,250,251,254]);

// Process each pattern
for (const pattern of patterns) {
  // Process connections_up (pattern is "below" these)
  // The referenced pattern should have this pattern in its connections_down
  for (const upId of pattern.connections_up || []) {
    const upPattern = patternMap.get(upId);
    if (!upPattern) {
      deadRefsFound.push({ from: pattern.id, to: upId, type: 'connections_up' });
      continue;
    }
    
    // Add back-reference if not already present
    if (!upPattern.connections_down) {
      upPattern.connections_down = [];
    }
    if (!upPattern.connections_down.includes(pattern.id)) {
      upPattern.connections_down.push(pattern.id);
      backRefsAdded++;
    }
  }
  
  // Process connections_down (pattern is "above" these)
  // The referenced pattern should have this pattern in its connections_up
  for (const downId of pattern.connections_down || []) {
    const downPattern = patternMap.get(downId);
    if (!downPattern) {
      deadRefsFound.push({ from: pattern.id, to: downId, type: 'connections_down' });
      continue;
    }
    
    // Add back-reference if not already present
    if (!downPattern.connections_up) {
      downPattern.connections_up = [];
    }
    if (!downPattern.connections_up.includes(pattern.id)) {
      downPattern.connections_up.push(pattern.id);
      backRefsAdded++;
    }
  }
}

// Sort connection arrays for consistency
for (const pattern of patterns) {
  if (pattern.connections_up) {
    pattern.connections_up.sort((a, b) => a - b);
  }
  if (pattern.connections_down) {
    pattern.connections_down.sort((a, b) => a - b);
  }
}

// Write updated patterns
fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));

console.log('=== Back-Reference Summary ===');
console.log(`Back-references added: ${backRefsAdded}`);
console.log(`Dead references found: ${deadRefsFound.length}`);

if (deadRefsFound.length > 0 && deadRefsFound.length <= 20) {
  console.log('\nDead references:');
  deadRefsFound.forEach(d => {
    console.log(`  Pattern ${d.from} -> ${d.to} (${d.type})`);
  });
} else if (deadRefsFound.length > 20) {
  console.log(`\nFirst 20 dead references:`);
  deadRefsFound.slice(0, 20).forEach(d => {
    console.log(`  Pattern ${d.from} -> ${d.to} (${d.type})`);
  });
}

console.log(`\nUpdated ${patternsPath}`);
