const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdPath = path.join(__dirname, '..', 'LANGUAGE-A-100-PATTERNS.md');
const content = fs.readFileSync(mdPath, 'utf-8');

// Category mapping
const categoryMap = {
  1: { id: 'fifteen-minute-life', label: 'Patterns for the Fifteen-Minute Life' },
  2: { id: 'fifteen-minute-life', label: 'Patterns for the Fifteen-Minute Life' },
  3: { id: 'fifteen-minute-life', label: 'Patterns for the Fifteen-Minute Life' },
  4: { id: 'fifteen-minute-life', label: 'Patterns for the Fifteen-Minute Life' },
  5: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  6: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  7: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  8: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  9: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  10: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  11: { id: 'digital-age-dwelling', label: 'Patterns for Dwelling in the Digital Age' },
  12: { id: 'housing-diversity', label: 'Patterns for Housing Diversity' },
  13: { id: 'housing-diversity', label: 'Patterns for Housing Diversity' },
  14: { id: 'housing-diversity', label: 'Patterns for Housing Diversity' },
  15: { id: 'housing-diversity', label: 'Patterns for Housing Diversity' },
  16: { id: 'climate-resilience', label: 'Patterns for Climate Resilience' },
  17: { id: 'climate-resilience', label: 'Patterns for Climate Resilience' },
  18: { id: 'climate-resilience', label: 'Patterns for Climate Resilience' },
  19: { id: 'climate-resilience', label: 'Patterns for Climate Resilience' },
  20: { id: 'climate-resilience', label: 'Patterns for Climate Resilience' },
  21: { id: 'energy-envelope', label: 'Patterns for Energy and Envelope' },
  22: { id: 'energy-envelope', label: 'Patterns for Energy and Envelope' },
  23: { id: 'energy-envelope', label: 'Patterns for Energy and Envelope' },
  24: { id: 'food-water', label: 'Patterns for Food and Water' },
  25: { id: 'food-water', label: 'Patterns for Food and Water' },
  26: { id: 'food-water', label: 'Patterns for Food and Water' },
  27: { id: 'adaptive-reuse', label: 'Patterns for Adaptive Reuse' },
  28: { id: 'adaptive-reuse', label: 'Patterns for Adaptive Reuse' },
  29: { id: 'adaptive-reuse', label: 'Patterns for Adaptive Reuse' },
  30: { id: 'health-biophilia', label: 'Patterns for Health and Biophilia' },
  31: { id: 'health-biophilia', label: 'Patterns for Health and Biophilia' },
  32: { id: 'health-biophilia', label: 'Patterns for Health and Biophilia' },
  33: { id: 'health-biophilia', label: 'Patterns for Health and Biophilia' },
  34: { id: 'foundation', label: 'Foundation Patterns' },
  35: { id: 'foundation', label: 'Foundation Patterns' },
  36: { id: 'foundation', label: 'Foundation Patterns' },
  37: { id: 'foundation', label: 'Foundation Patterns' },
  38: { id: 'foundation', label: 'Foundation Patterns' },
  39: { id: 'foundation', label: 'Foundation Patterns' },
  40: { id: 'foundation', label: 'Foundation Patterns' },
  41: { id: 'foundation', label: 'Foundation Patterns' },
  42: { id: 'foundation', label: 'Foundation Patterns' },
  43: { id: 'foundation', label: 'Foundation Patterns' },
  44: { id: 'foundation', label: 'Foundation Patterns' },
  45: { id: 'foundation', label: 'Foundation Patterns' },
  46: { id: 'foundation', label: 'Foundation Patterns' },
  47: { id: 'foundation', label: 'Foundation Patterns' },
  48: { id: 'foundation', label: 'Foundation Patterns' },
  49: { id: 'foundation', label: 'Foundation Patterns' },
  50: { id: 'community-governance', label: 'Patterns for Community Governance' },
  51: { id: 'community-governance', label: 'Patterns for Community Governance' },
  52: { id: 'community-governance', label: 'Patterns for Community Governance' },
  53: { id: 'community-governance', label: 'Patterns for Community Governance' },
  54: { id: 'construction-making', label: 'Patterns for Construction and Making' },
  55: { id: 'construction-making', label: 'Patterns for Construction and Making' },
  56: { id: 'construction-making', label: 'Patterns for Construction and Making' },
  57: { id: 'construction-making', label: 'Patterns for Construction and Making' },
  58: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  59: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  60: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  61: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  62: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  63: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  64: { id: 'northern-living', label: 'Patterns for Northern and Cold-Climate Living' },
  65: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  66: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  67: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  68: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  69: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  70: { id: 'water-infrastructure', label: 'Patterns for Water and Infrastructure' },
  71: { id: 'children-play', label: 'Patterns for Children and Play' },
  72: { id: 'children-play', label: 'Patterns for Children and Play' },
  73: { id: 'children-play', label: 'Patterns for Children and Play' },
  74: { id: 'children-play', label: 'Patterns for Children and Play' },
  75: { id: 'children-play', label: 'Patterns for Children and Play' },
  76: { id: 'children-play', label: 'Patterns for Children and Play' },
  77: { id: 'aging-accessibility', label: 'Patterns for Aging and Accessibility' },
  78: { id: 'aging-accessibility', label: 'Patterns for Aging and Accessibility' },
  79: { id: 'aging-accessibility', label: 'Patterns for Aging and Accessibility' },
  80: { id: 'aging-accessibility', label: 'Patterns for Aging and Accessibility' },
  81: { id: 'aging-accessibility', label: 'Patterns for Aging and Accessibility' },
  82: { id: 'light-darkness', label: 'Patterns for Light and Darkness' },
  83: { id: 'light-darkness', label: 'Patterns for Light and Darkness' },
  84: { id: 'light-darkness', label: 'Patterns for Light and Darkness' },
  85: { id: 'light-darkness', label: 'Patterns for Light and Darkness' },
  86: { id: 'light-darkness', label: 'Patterns for Light and Darkness' },
  87: { id: 'sound-silence', label: 'Patterns for Sound and Silence' },
  88: { id: 'sound-silence', label: 'Patterns for Sound and Silence' },
  89: { id: 'sound-silence', label: 'Patterns for Sound and Silence' },
  90: { id: 'sound-silence', label: 'Patterns for Sound and Silence' },
  91: { id: 'the-commons', label: 'Patterns for the Commons' },
  92: { id: 'the-commons', label: 'Patterns for the Commons' },
  93: { id: 'the-commons', label: 'Patterns for the Commons' },
  94: { id: 'the-commons', label: 'Patterns for the Commons' },
  95: { id: 'the-commons', label: 'Patterns for the Commons' },
  96: { id: 'density-done-right', label: 'Patterns for Density Done Right' },
  97: { id: 'density-done-right', label: 'Patterns for Density Done Right' },
  98: { id: 'density-done-right', label: 'Patterns for Density Done Right' },
  99: { id: 'density-done-right', label: 'Patterns for Density Done Right' },
  100: { id: 'density-done-right', label: 'Patterns for Density Done Right' },
};

// Scale mapping based on pattern content and categories
const scaleMap = {
  1: 'neighborhood', 2: 'neighborhood', 3: 'neighborhood', 4: 'neighborhood',
  5: 'building', 6: 'building', 7: 'building', 8: 'building', 9: 'building', 10: 'building', 11: 'building',
  12: 'building', 13: 'building', 14: 'building', 15: 'building',
  16: 'building', 17: 'building', 18: 'building', 19: 'building', 20: 'construction',
  21: 'neighborhood', 22: 'building', 23: 'building',
  24: 'building', 25: 'building', 26: 'building',
  27: 'building', 28: 'building', 29: 'neighborhood',
  30: 'building', 31: 'building', 32: 'construction', 33: 'building',
  34: 'building', 35: 'building', 36: 'building', 37: 'building', 38: 'building', 39: 'building',
  40: 'neighborhood', 41: 'neighborhood', 42: 'neighborhood', 43: 'neighborhood', 44: 'neighborhood',
  45: 'construction', 46: 'construction', 47: 'construction', 48: 'construction', 49: 'construction',
  50: 'neighborhood', 51: 'neighborhood', 52: 'neighborhood', 53: 'neighborhood',
  54: 'construction', 55: 'construction', 56: 'construction', 57: 'neighborhood',
  58: 'neighborhood', 59: 'building', 60: 'neighborhood', 61: 'building', 62: 'construction', 63: 'construction', 64: 'construction',
  65: 'building', 66: 'building', 67: 'building', 68: 'building', 69: 'construction', 70: 'building',
  71: 'neighborhood', 72: 'neighborhood', 73: 'building', 74: 'building', 75: 'neighborhood', 76: 'neighborhood',
  77: 'neighborhood', 78: 'neighborhood', 79: 'neighborhood', 80: 'building', 81: 'building',
  82: 'building', 83: 'building', 84: 'construction', 85: 'building', 86: 'building',
  87: 'building', 88: 'neighborhood', 89: 'neighborhood', 90: 'building',
  91: 'neighborhood', 92: 'neighborhood', 93: 'building', 94: 'neighborhood', 95: 'neighborhood',
  96: 'neighborhood', 97: 'neighborhood', 98: 'building', 99: 'building', 100: 'neighborhood',
};

// Extract pattern number references from text like "THE FIFTEEN-MINUTE NEIGHBORHOOD (1)"
function extractPatternRefs(text) {
  const refs = [];
  const regex = /\((\d{1,3})\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 100) {
      refs.push(num);
    }
  }
  return [...new Set(refs)];
}

// Parse confidence from stars
function parseConfidence(titleLine) {
  if (titleLine.includes('★★')) return 2;
  if (titleLine.includes('★')) return 1;
  return 0;
}

// Parse pattern name from title
function parseName(titleLine) {
  // Remove pattern number and stars
  const match = titleLine.match(/##\s+\d+\.\s+(.+?)\s*[★☆]/);
  if (match) return match[1].trim();
  // Fallback
  return titleLine.replace(/##\s+\d+\.\s+/, '').replace(/[★☆\s]+$/, '').trim();
}

// Split content into patterns
const patternBlocks = content.split(/(?=^## \d+\.)/m).filter(block => /^## \d+\./.test(block.trim()));

const patterns = [];

for (const block of patternBlocks) {
  const lines = block.split('\n');
  const titleLine = lines[0];

  // Extract pattern number
  const numMatch = titleLine.match(/## (\d+)\./);
  if (!numMatch) continue;

  const id = parseInt(numMatch[1], 10);
  if (id < 1 || id > 100) continue;

  const name = parseName(titleLine);
  const confidence = parseConfidence(titleLine);

  // Find connections up (first bold italic line starting with "…")
  // Find problem (bold paragraph after connections)
  // Find body (everything between problem and Therefore)
  // Find solution (bold "Therefore:" paragraph)
  // Find connections down (final bold italic line)

  let connectionsUpText = '';
  let problem = '';
  let body = '';
  let solution = '';
  let connectionsDownText = '';

  let currentSection = 'start';
  let bodyLines = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines at start
    if (currentSection === 'start' && line.trim() === '') continue;

    // Connections up - starts with **…
    if (currentSection === 'start' && line.startsWith('**…')) {
      connectionsUpText = line;
      currentSection = 'afterConnUp';
      continue;
    }

    // Skip note about foundation patterns
    if (line.includes('patterns 34–49 are FOUNDATION PATTERNS')) {
      continue;
    }

    // Problem - first bold paragraph after connections up
    if ((currentSection === 'afterConnUp' || currentSection === 'start') && line.startsWith('**') && !line.startsWith('**…')) {
      problem = line.replace(/^\*\*|\*\*$/g, '').trim();
      currentSection = 'body';
      continue;
    }

    // Solution - starts with **Therefore:
    if (line.startsWith('**Therefore:') || line.startsWith('**Therefore,')) {
      solution = line.replace(/^\*\*|\*\*$/g, '').replace(/^Therefore:\s*/, '').replace(/^Therefore,\s*/, '').trim();
      currentSection = 'afterSolution';
      continue;
    }

    // Connections down - starts with **… after solution
    if (currentSection === 'afterSolution' && line.startsWith('**…')) {
      connectionsDownText = line;
      break;
    }

    // Body text
    if (currentSection === 'body' && line.trim() !== '---') {
      bodyLines.push(line);
    }
  }

  body = bodyLines.join('\n').trim();

  // Parse connection references
  const connections_up = extractPatternRefs(connectionsUpText);
  const connections_down = extractPatternRefs(connectionsDownText);

  const cat = categoryMap[id] || { id: 'unknown', label: 'Unknown' };
  const scale = scaleMap[id] || 'building';

  patterns.push({
    id,
    name,
    number: id.toString().padStart(2, '0'),
    scale,
    category: cat.id,
    categoryLabel: cat.label,
    confidence,
    status: 'candidate',
    problem,
    body,
    solution,
    connections_up,
    connections_down,
  });
}

// Sort by id
patterns.sort((a, b) => a.id - b.id);

// Write output
const outputPath = path.join(__dirname, '..', 'data', 'patterns.json');
fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));

console.log(`Parsed ${patterns.length} patterns`);

// Validate
const ids = patterns.map(p => p.id);
for (let i = 1; i <= 100; i++) {
  if (!ids.includes(i)) {
    console.log(`Missing pattern ${i}`);
  }
}

// Check connections
let badRefs = 0;
for (const p of patterns) {
  for (const ref of [...p.connections_up, ...p.connections_down]) {
    if (!ids.includes(ref)) {
      console.log(`Pattern ${p.id} references invalid pattern ${ref}`);
      badRefs++;
    }
  }
}

if (badRefs === 0) {
  console.log('All connection references are valid');
}
