// Script to update catalog-plan.json:
// 1. Replace entries 101-108 with Category X patterns from patterns.json
// 2. Add new entries 255-257 for displaced patterns

const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/catalog-plan.json');
const patternsPath = path.join(__dirname, '../data/patterns.json');

// Read files
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));

// Get Category X patterns from patterns.json (IDs 101-108)
const categoryXPatterns = patterns.filter(p => p.id >= 101 && p.id <= 108);

// Store the old entries 101, 102, 104 to reassign as 255, 256, 257
const oldEntries = {};
catalog.forEach(entry => {
  if (entry.id === 101 || entry.id === 102 || entry.id === 104) {
    oldEntries[entry.id] = entry;
  }
});

// Transform Category X patterns to catalog-plan format
function toCatalogFormat(p) {
  return {
    id: p.id,
    name: p.name,
    scale: p.scale,
    category: p.category,
    status: "existing",  // They exist in patterns.json
    brief: p.problem ? p.problem.substring(0, 100) + '...' : '',
    tension: p.problem ? p.problem.substring(0, 150) : ''
  };
}

// Create new entries for displaced patterns (255-257)
const newEntries = [
  {
    id: 255,
    name: "The Market Street",
    scale: "neighborhood",
    category: "fifteen-minute-life",
    status: "planned",
    brief: oldEntries[101]?.brief || "A street where small-scale commerce, food vendors, and daily services cluster within walking distance",
    tension: oldEntries[101]?.tension || "When commercial activity is concentrated in car-dependent power centers, daily errands require driving"
  },
  {
    id: 256,
    name: "The Micro-Mobility Lane",
    scale: "neighborhood", 
    category: "fifteen-minute-life",
    status: "planned",
    brief: oldEntries[102]?.brief || "Dedicated infrastructure for e-bikes, scooters, and small electric vehicles",
    tension: oldEntries[102]?.tension || "When bike lanes must accommodate fast e-bikes alongside slow cyclists, neither feels safe"
  },
  {
    id: 257,
    name: "The Corner Store Building",
    scale: "building",
    category: "fifteen-minute-life", 
    status: "planned",
    brief: oldEntries[104]?.brief || "A building type that combines ground-floor retail with residential above at neighborhood scale",
    tension: oldEntries[104]?.tension || "When zoning separates residential from commercial uses, neighborhoods lack small shops"
  }
];

// Update catalog
const updatedCatalog = catalog.map(entry => {
  const catXPattern = categoryXPatterns.find(p => p.id === entry.id);
  if (catXPattern) {
    return toCatalogFormat(catXPattern);
  }
  return entry;
});

// Add new entries 255-257
updatedCatalog.push(...newEntries);

// Sort by ID
updatedCatalog.sort((a, b) => a.id - b.id);

// Write back
fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2));

console.log('Updated catalog-plan.json:');
console.log('- Replaced entries 101-108 with Category X patterns');
console.log('- Added new entries 255-257 for displaced patterns');
console.log('- Total entries:', updatedCatalog.length);

// Verify
const verify101 = updatedCatalog.find(e => e.id === 101);
const verify255 = updatedCatalog.find(e => e.id === 255);
console.log('\nVerification:');
console.log('ID 101:', verify101?.name);
console.log('ID 255:', verify255?.name);
