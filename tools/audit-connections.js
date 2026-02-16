const data = require('../data/patterns.json');

let brokenLinks = [];
let totalPairs = 0;

// Build a map for quick lookup
const patternMap = new Map();
data.forEach(p => patternMap.set(p.id, p));

// Check all connections
data.forEach(pattern => {
  const id = pattern.id;

  // Check connections_up: if A has B in connections_up, B should have A in connections_down
  (pattern.connections_up || []).forEach(upId => {
    totalPairs++;
    const upPattern = patternMap.get(upId);
    if (!upPattern) {
      brokenLinks.push({
        type: 'missing_pattern',
        from: id,
        to: upId,
        direction: 'connections_up references non-existent pattern'
      });
    } else if (!(upPattern.connections_down || []).includes(id)) {
      brokenLinks.push({
        type: 'missing_reciprocal',
        from: id,
        fromName: pattern.name,
        to: upId,
        toName: upPattern.name,
        direction: 'connections_up → missing in connections_down'
      });
    }
  });

  // Check connections_down: if A has B in connections_down, B should have A in connections_up
  (pattern.connections_down || []).forEach(downId => {
    totalPairs++;
    const downPattern = patternMap.get(downId);
    if (!downPattern) {
      brokenLinks.push({
        type: 'missing_pattern',
        from: id,
        to: downId,
        direction: 'connections_down references non-existent pattern'
      });
    } else if (!(downPattern.connections_up || []).includes(id)) {
      brokenLinks.push({
        type: 'missing_reciprocal',
        from: id,
        fromName: pattern.name,
        to: downId,
        toName: downPattern.name,
        direction: 'connections_down → missing in connections_up'
      });
    }
  });
});

console.log('=== Bidirectional Network Connection Audit ===');
console.log();
console.log('Total patterns:', data.length);
console.log('Total connection pairs checked:', totalPairs);
console.log('Broken links found:', brokenLinks.length);
console.log();

if (brokenLinks.length === 0) {
  console.log('✓ All bidirectional connections are valid!');
} else {
  console.log('Broken Links:');
  brokenLinks.forEach(link => {
    console.log(`  Pattern ${link.from} (${link.fromName}) → ${link.to} (${link.toName}): ${link.direction}`);
  });
}
