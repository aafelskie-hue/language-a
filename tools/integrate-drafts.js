/**
 * Integrate draft markdown files into patterns.json
 */

const fs = require('fs');
const path = require('path');

// IDs to integrate (update this list for each integration batch)
const newIds = [];

// Parse YAML front matter from markdown
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};
  const lines = yaml.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for array item (starts with "  - ")
    if (line.match(/^\s+-\s+/)) {
      if (currentArray !== null && currentKey) {
        let value = line.replace(/^\s+-\s+/, '').trim();
        // Handle numbers
        if (!isNaN(value) && value !== '') value = Number(value);
        // Handle quoted strings
        else if ((value.startsWith('"') && value.endsWith('"')) ||
                 (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        currentArray.push(value);
      }
      continue;
    }

    // If we were building an array, save it
    if (currentArray !== null && currentKey) {
      result[currentKey] = currentArray;
      currentArray = null;
      currentKey = null;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Check if this starts a multi-line array (empty value)
    if (value === '') {
      currentKey = key;
      currentArray = [];
      continue;
    }

    // Handle inline arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if parse fails
      }
    }
    // Handle quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Handle booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Handle numbers
    else if (!isNaN(value) && value !== '') value = Number(value);

    result[key] = value;
  }

  // Save any trailing array
  if (currentArray !== null && currentKey) {
    result[currentKey] = currentArray;
  }

  return result;
}

// Extract body content from markdown
function extractBodyContent(content) {
  // Get content after front matter
  const afterFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n\n/, '');

  // Split into paragraphs
  const paragraphs = afterFrontMatter.split('\n\n');

  let problem = '';
  let body = [];
  let solution = '';

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();

    // Skip header line
    if (p.startsWith('#')) continue;

    // Skip context line (starts with **…)
    if (p.startsWith('**…')) continue;

    // Solution paragraph (contains Therefore:)
    if (p.includes('**Therefore:')) {
      const match = p.match(/\*\*Therefore:([^*]+)\*\*/);
      if (match) {
        solution = match[1].trim();
      }
      continue;
    }

    // Skip trailing context line
    if (p.startsWith('**…this pattern') || p.startsWith('**...this pattern')) continue;

    // Problem is first bold paragraph (the one with the tension)
    if (!problem && p.startsWith('**') && p.endsWith('**')) {
      problem = p.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      continue;
    }

    // Everything else is body
    if (p && !p.startsWith('---')) {
      body.push(p);
    }
  }

  return {
    problem,
    body: body.join('\n\n'),
    solution
  };
}

// Main execution
const draftsDir = path.join(__dirname, '..', 'drafts');
const patternsPath = path.join(__dirname, '..', 'data', 'patterns.json');

// Load existing patterns
const existingPatterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
console.log(`Existing patterns: ${existingPatterns.length}`);

// Process new drafts
const newPatterns = [];
const errors = [];

for (const id of newIds) {
  // Find draft file
  const files = fs.readdirSync(draftsDir).filter(f => f.startsWith(`${id}-`) && f.endsWith('.md'));

  if (files.length === 0) {
    errors.push({ id, error: 'No draft file found' });
    continue;
  }

  const filePath = path.join(draftsDir, files[0]);
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse front matter
  const frontMatter = parseFrontMatter(content);
  if (!frontMatter) {
    errors.push({ id, error: 'Failed to parse front matter' });
    continue;
  }

  // Extract body content
  const { problem, body, solution } = extractBodyContent(content);

  // Build pattern object
  const pattern = {
    id: frontMatter.id,
    name: frontMatter.name,
    number: String(frontMatter.id),
    scale: frontMatter.scale,
    category: frontMatter.category,
    categoryLabel: frontMatter.categoryLabel,
    confidence: frontMatter.confidence,
    status: frontMatter.status,
    problem: problem,
    body: body || 'Content pending extraction.',
    solution: solution,
    connections_up: frontMatter.connections_up || [],
    connections_down: frontMatter.connections_down || [],
    tags: frontMatter.tags || [],
    coldClimate: frontMatter.coldClimate || false
  };

  newPatterns.push(pattern);
}

console.log(`New patterns parsed: ${newPatterns.length}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('Error details:');
  errors.forEach(e => console.log(`  - ID ${e.id}: ${e.error}`));
}

// Check for ID collisions
const existingIdSet = new Set(existingPatterns.map(p => p.id));
const collisions = newPatterns.filter(p => existingIdSet.has(p.id));
if (collisions.length > 0) {
  console.log(`WARNING: ${collisions.length} ID collisions found, skipping: ${collisions.map(p => p.id).join(', ')}`);
  newPatterns.splice(0, newPatterns.length, ...newPatterns.filter(p => !existingIdSet.has(p.id)));
}

// Merge patterns (sorted by ID)
const allPatterns = [...existingPatterns, ...newPatterns].sort((a, b) => a.id - b.id);
console.log(`Total patterns after merge: ${allPatterns.length}`);

// Create a map for quick lookup
const patternMap = new Map(allPatterns.map(p => [p.id, p]));

// Add back-references for bidirectional connectivity
let backRefsAdded = 0;
for (const newPattern of newPatterns) {
  // For each upward connection in the new pattern
  for (const upId of (newPattern.connections_up || [])) {
    const targetPattern = patternMap.get(upId);
    if (!targetPattern) continue;

    // Target should have downward connection back to new pattern
    if (!targetPattern.connections_down) targetPattern.connections_down = [];
    if (!targetPattern.connections_down.includes(newPattern.id)) {
      targetPattern.connections_down.push(newPattern.id);
      targetPattern.connections_down.sort((a, b) => a - b);
      backRefsAdded++;
    }
  }

  // For each downward connection in the new pattern
  for (const downId of (newPattern.connections_down || [])) {
    const targetPattern = patternMap.get(downId);
    if (!targetPattern) continue;

    // Target should have upward connection back to new pattern
    if (!targetPattern.connections_up) targetPattern.connections_up = [];
    if (!targetPattern.connections_up.includes(newPattern.id)) {
      targetPattern.connections_up.push(newPattern.id);
      targetPattern.connections_up.sort((a, b) => a - b);
      backRefsAdded++;
    }
  }
}
console.log(`Back-references added: ${backRefsAdded}`);

// Write merged patterns
fs.writeFileSync(patternsPath, JSON.stringify(allPatterns, null, 2));
console.log(`Wrote ${allPatterns.length} patterns to ${patternsPath}`);

// Output summary
console.log('\n=== Integration Summary ===');
console.log(`Patterns before: ${existingPatterns.length}`);
console.log(`New patterns added: ${newPatterns.length}`);
console.log(`Back-references added: ${backRefsAdded}`);
console.log(`Total patterns: ${allPatterns.length}`);
console.log(`IDs added: ${newPatterns.map(p => p.id).join(', ')}`);
