#!/usr/bin/env node
/**
 * Three operations:
 * 1. Strip "Therefore" from solution openings
 * 2. Relocate pattern 254 to id 50
 * 3. Regroup reading order by category within scale
 */

const fs = require('fs');
const path = require('path');

const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');
const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));

console.log('='.repeat(60));
console.log('OPERATION 1: Strip "Therefore" from solution openings');
console.log('='.repeat(60));

let thereforeCount = 0;

patterns.forEach(p => {
  if (p.solution) {
    // Match "Therefore" at the start followed by optional punctuation and space
    const match = p.solution.match(/^Therefore[,:\s]*/i);
    if (match && match[0].toLowerCase().startsWith('therefore')) {
      const original = p.solution;
      let newSolution = p.solution.slice(match[0].length);
      // Capitalize first letter if not already
      if (newSolution.length > 0) {
        newSolution = newSolution.charAt(0).toUpperCase() + newSolution.slice(1);
      }
      p.solution = newSolution;
      thereforeCount++;
      console.log(`  [${p.id}] "${p.name}": stripped "${match[0]}"`);
    }
  }
});

console.log(`\nTotal solutions modified: ${thereforeCount}`);

console.log('\n' + '='.repeat(60));
console.log('OPERATION 2: Relocate The Seasonal Celebration (254 → 50)');
console.log('='.repeat(60));

// Find pattern 254
const pattern254 = patterns.find(p => p.id === 254);
if (!pattern254) {
  console.log('ERROR: Pattern 254 not found!');
  process.exit(1);
}

console.log(`Found pattern 254: "${pattern254.name}"`);

// Check if id 50 already exists
const existing50 = patterns.find(p => p.id === 50);
if (existing50) {
  console.log(`ERROR: Pattern 50 already exists: "${existing50.name}"`);
  process.exit(1);
}

// Change id from 254 to 50
pattern254.id = 50;
console.log(`Changed pattern id from 254 to 50`);

// Update all connection references from 254 to 50
let connectionUpdates = 0;

patterns.forEach(p => {
  if (p.connections_up) {
    p.connections_up.forEach(conn => {
      if (conn.target_id === 254) {
        conn.target_id = 50;
        connectionUpdates++;
        console.log(`  Updated connections_up in [${p.id}] "${p.name}": 254 → 50`);
      }
    });
  }
  if (p.connections_down) {
    p.connections_down.forEach(conn => {
      if (conn.target_id === 254) {
        conn.target_id = 50;
        connectionUpdates++;
        console.log(`  Updated connections_down in [${p.id}] "${p.name}": 254 → 50`);
      }
    });
  }
});

console.log(`\nConnection references updated: ${connectionUpdates}`);

// Verify pattern 50 exists and check its connections
const pattern50 = patterns.find(p => p.id === 50);
console.log(`\nPattern 50 verification:`);
console.log(`  Name: ${pattern50.name}`);
console.log(`  connections_up: ${pattern50.connections_up?.length || 0}`);
console.log(`  connections_down: ${pattern50.connections_down?.length || 0}`);

// Check for any remaining references to 254
let remaining254 = 0;
patterns.forEach(p => {
  if (p.id === 254) remaining254++;
  p.connections_up?.forEach(c => { if (c.target_id === 254) remaining254++; });
  p.connections_down?.forEach(c => { if (c.target_id === 254) remaining254++; });
});
console.log(`\nRemaining references to id 254: ${remaining254}`);

console.log('\n' + '='.repeat(60));
console.log('OPERATION 3: Regroup reading order by category within scale');
console.log('='.repeat(60));

// Category orders per scale
const neighborhoodCategoryOrder = [
  'foundation', 'fifteen-minute-life', 'community-governance', 'housing-diversity',
  'density-done-right', 'climate-resilience', 'children-play', 'aging-accessibility',
  'food-water', 'the-commons', 'sound-silence', 'northern-living', 'construction-making'
];

const buildingCategoryOrder = [
  'foundation', 'housing-diversity', 'energy-envelope', 'climate-resilience',
  'health-biophilia', 'light-darkness', 'sound-silence', 'digital-age-dwelling',
  'adaptive-reuse', 'aging-accessibility', 'northern-living', 'food-water',
  'water-infrastructure', 'construction-making', 'the-commons', 'density-done-right'
];

const constructionCategoryOrder = [
  'construction-making', 'foundation', 'energy-envelope', 'water-infrastructure',
  'climate-resilience', 'northern-living', 'adaptive-reuse'
];

// Get current reading_order assignments
const neighborhood = patterns.filter(p => p.reading_order >= 1 && p.reading_order <= 74);
const building = patterns.filter(p => p.reading_order >= 75 && p.reading_order <= 190);
const construction = patterns.filter(p => p.reading_order >= 191 && p.reading_order <= 253);

console.log(`\nCurrent scale distribution:`);
console.log(`  Neighborhood: ${neighborhood.length} patterns (expected 74)`);
console.log(`  Building: ${building.length} patterns (expected 116)`);
console.log(`  Construction: ${construction.length} patterns (expected 63)`);

function getCategoryIndex(category, orderList) {
  const idx = orderList.indexOf(category);
  if (idx >= 0) return idx;
  // Put unlisted categories at end
  return orderList.length + 1000; // Will be sorted alphabetically within this group
}

function sortByCategory(patternList, categoryOrder) {
  // Group by category
  const categorized = {};
  patternList.forEach(p => {
    const cat = p.category || 'zzz-uncategorized';
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(p);
  });

  // Sort categories by the specified order
  const sortedCategories = Object.keys(categorized).sort((a, b) => {
    const idxA = getCategoryIndex(a, categoryOrder);
    const idxB = getCategoryIndex(b, categoryOrder);
    if (idxA !== idxB) return idxA - idxB;
    // Both unlisted, sort alphabetically
    return a.localeCompare(b);
  });

  // Sort patterns within each category by id
  const result = [];
  sortedCategories.forEach(cat => {
    const sorted = categorized[cat].sort((a, b) => a.id - b.id);
    result.push(...sorted);
  });

  return result;
}

// Sort each scale
const sortedNeighborhood = sortByCategory(neighborhood, neighborhoodCategoryOrder);
const sortedBuilding = sortByCategory(building, buildingCategoryOrder);
const sortedConstruction = sortByCategory(construction, constructionCategoryOrder);

// Assign new reading_order values
let currentOrder = 1;

sortedNeighborhood.forEach(p => {
  p.reading_order = currentOrder++;
});

sortedBuilding.forEach(p => {
  p.reading_order = currentOrder++;
});

sortedConstruction.forEach(p => {
  p.reading_order = currentOrder++;
});

console.log(`\nAssigned reading_order 1 through ${currentOrder - 1}`);

// Count category transitions
function countTransitions(patternList) {
  let transitions = 0;
  for (let i = 1; i < patternList.length; i++) {
    if (patternList[i].category !== patternList[i-1].category) {
      transitions++;
    }
  }
  return transitions;
}

const neighborhoodTransitions = countTransitions(sortedNeighborhood);
const buildingTransitions = countTransitions(sortedBuilding);
const constructionTransitions = countTransitions(sortedConstruction);

console.log(`\nCategory transitions:`);
console.log(`  Neighborhood: ${neighborhoodTransitions} (was 48)`);
console.log(`  Building: ${buildingTransitions}`);
console.log(`  Construction: ${constructionTransitions}`);

// Report first/last per scale
console.log(`\nScale boundaries:`);
console.log(`  Neighborhood: [${sortedNeighborhood[0].id}] "${sortedNeighborhood[0].name}" (reading_order ${sortedNeighborhood[0].reading_order}) → [${sortedNeighborhood[sortedNeighborhood.length-1].id}] "${sortedNeighborhood[sortedNeighborhood.length-1].name}" (reading_order ${sortedNeighborhood[sortedNeighborhood.length-1].reading_order})`);
console.log(`  Building: [${sortedBuilding[0].id}] "${sortedBuilding[0].name}" (reading_order ${sortedBuilding[0].reading_order}) → [${sortedBuilding[sortedBuilding.length-1].id}] "${sortedBuilding[sortedBuilding.length-1].name}" (reading_order ${sortedBuilding[sortedBuilding.length-1].reading_order})`);
console.log(`  Construction: [${sortedConstruction[0].id}] "${sortedConstruction[0].name}" (reading_order ${sortedConstruction[0].reading_order}) → [${sortedConstruction[sortedConstruction.length-1].id}] "${sortedConstruction[sortedConstruction.length-1].name}" (reading_order ${sortedConstruction[sortedConstruction.length-1].reading_order})`);

console.log(`\nTotal patterns: ${patterns.length}`);

console.log('\n' + '='.repeat(60));
console.log('VALIDATION');
console.log('='.repeat(60));

// Check for overlapping pairs (connections that point both ways with different relationship types)
let overlappingPairs = 0;
patterns.forEach(p => {
  const upTargets = new Set((p.connections_up || []).map(c => c.target_id));
  const downTargets = new Set((p.connections_down || []).map(c => c.target_id));
  upTargets.forEach(t => {
    if (downTargets.has(t)) {
      overlappingPairs++;
      console.log(`  Overlap: Pattern ${p.id} has both up and down connection to ${t}`);
    }
  });
});
console.log(`Overlapping pairs: ${overlappingPairs}`);

// Check for dead references
const allIds = new Set(patterns.map(p => p.id));
let deadRefs = 0;
patterns.forEach(p => {
  (p.connections_up || []).forEach(c => {
    if (!allIds.has(c.target_id)) {
      deadRefs++;
      console.log(`  Dead ref: Pattern ${p.id} connections_up points to non-existent ${c.target_id}`);
    }
  });
  (p.connections_down || []).forEach(c => {
    if (!allIds.has(c.target_id)) {
      deadRefs++;
      console.log(`  Dead ref: Pattern ${p.id} connections_down points to non-existent ${c.target_id}`);
    }
  });
});
console.log(`Dead references: ${deadRefs}`);

// Check for self-references
let selfRefs = 0;
patterns.forEach(p => {
  (p.connections_up || []).forEach(c => {
    if (c.target_id === p.id) {
      selfRefs++;
      console.log(`  Self-ref: Pattern ${p.id} connections_up`);
    }
  });
  (p.connections_down || []).forEach(c => {
    if (c.target_id === p.id) {
      selfRefs++;
      console.log(`  Self-ref: Pattern ${p.id} connections_down`);
    }
  });
});
console.log(`Self-references: ${selfRefs}`);

// Check reading order
const readingOrders = patterns.map(p => p.reading_order).sort((a, b) => a - b);
const expectedOrders = Array.from({length: 253}, (_, i) => i + 1);
const sequentialOk = JSON.stringify(readingOrders) === JSON.stringify(expectedOrders);
console.log(`Reading order sequential 1-253: ${sequentialOk ? 'YES' : 'NO'}`);
if (!sequentialOk) {
  const missing = expectedOrders.filter(x => !readingOrders.includes(x));
  const duplicates = readingOrders.filter((x, i) => readingOrders.indexOf(x) !== i);
  if (missing.length > 0) console.log(`  Missing: ${missing.join(', ')}`);
  if (duplicates.length > 0) console.log(`  Duplicates: ${[...new Set(duplicates)].join(', ')}`);
}

// Check pattern 50 exists
const finalPattern50 = patterns.find(p => p.id === 50);
console.log(`Pattern 50 exists: ${finalPattern50 ? 'YES - ' + finalPattern50.name : 'NO'}`);

// Check no references to 254
let refs254 = 0;
patterns.forEach(p => {
  if (p.id === 254) refs254++;
  (p.connections_up || []).forEach(c => { if (c.target_id === 254) refs254++; });
  (p.connections_down || []).forEach(c => { if (c.target_id === 254) refs254++; });
});
console.log(`References to id 254: ${refs254}`);

// Check solutions starting with Therefore
let thereforeSolutions = 0;
patterns.forEach(p => {
  if (p.solution && /^therefore/i.test(p.solution.trim())) {
    thereforeSolutions++;
    console.log(`  Solution still starts with Therefore: [${p.id}] "${p.name}"`);
  }
});
console.log(`Solutions beginning with "Therefore": ${thereforeSolutions}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Operation 1: ${thereforeCount} solutions modified (Therefore stripped)`);
console.log(`Operation 2: Pattern 254→50, ${connectionUpdates} connection references updated`);
console.log(`Operation 3: Reading order regrouped by category within scale`);
console.log(`  - Neighborhood transitions: ${neighborhoodTransitions}`);
console.log(`  - Building transitions: ${buildingTransitions}`);
console.log(`  - Construction transitions: ${constructionTransitions}`);
console.log(`\nValidation: ${overlappingPairs === 0 && deadRefs === 0 && selfRefs === 0 && sequentialOk && finalPattern50 && refs254 === 0 && thereforeSolutions === 0 ? 'ALL PASSED' : 'ISSUES FOUND'}`);

// Write updated patterns
fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
console.log(`\nPatterns file updated.`);
