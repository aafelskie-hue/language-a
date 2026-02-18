/**
 * Red Team Agent Parser
 * Parse pattern files from JSON and Markdown formats
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import type { PatternInput, PatternIndex } from './types.js';

// Path to the patterns JSON file
const PATTERNS_PATH = path.resolve(process.cwd(), 'data/patterns.json');

/**
 * Load all patterns from the JSON catalog
 */
export function loadPatternCatalog(): PatternInput[] {
  const raw = fs.readFileSync(PATTERNS_PATH, 'utf-8');
  return JSON.parse(raw) as PatternInput[];
}

/**
 * Get lightweight pattern index for network context
 */
export function getPatternIndex(): PatternIndex[] {
  const patterns = loadPatternCatalog();
  return patterns.map((p) => ({
    id: p.id,
    name: p.name,
    scale: p.scale,
    category: p.category,
    confidence: p.confidence,
  }));
}

/**
 * Load a single pattern by ID from the JSON catalog
 */
export function parsePatternFromJson(id: number): PatternInput | null {
  const patterns = loadPatternCatalog();
  return patterns.find((p) => p.id === id) || null;
}

/**
 * Parse a pattern from a Markdown file with YAML frontmatter
 *
 * Expected format:
 * ---
 * id: 16
 * name: Heat Refuge Room
 * scale: building
 * category: climate-resilience
 * categoryLabel: Climate Resilience
 * confidence: 2
 * status: candidate
 * connections_up: [15, 17]
 * connections_down: [18, 19]
 * tags: [thermal, comfort]
 * ---
 *
 * ## Problem
 *
 * Problem statement here...
 *
 * ## Context
 *
 * Body text with evidence...
 *
 * ## Solution
 *
 * Therefore: solution statement...
 */
export function parsePatternFromMarkdown(filePath: string): PatternInput | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    // Extract sections from content
    const sections = parseSections(content);

    // Validate required frontmatter fields
    if (!data.id || !data.name || !data.scale) {
      console.error(`Missing required frontmatter in ${filePath}`);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      number: String(data.id).padStart(2, '0'),
      scale: data.scale,
      category: data.category || 'uncategorized',
      categoryLabel: data.categoryLabel || data.category || 'Uncategorized',
      confidence: data.confidence ?? 1,
      status: data.status || 'candidate',
      problem: sections.problem || '',
      body: sections.context || sections.body || '',
      solution: sections.solution || '',
      connections_up: data.connections_up || [],
      connections_down: data.connections_down || [],
      tags: data.tags || [],
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse sections from markdown content
 */
function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
      }
      currentSection = headerMatch[1];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Format a pattern for review prompt
 */
export function formatPatternForReview(pattern: PatternInput): string {
  const confidenceStars = '★'.repeat(pattern.confidence) + '☆'.repeat(2 - pattern.confidence);

  return `# Pattern ${pattern.number}: ${pattern.name} ${confidenceStars}

**Scale:** ${pattern.scale}
**Category:** ${pattern.categoryLabel}
**Status:** ${pattern.status}

## Problem

${pattern.problem}

## Evidence & Context

${pattern.body}

## Solution

${pattern.solution}

## Network Connections

**Context (larger scale):** ${pattern.connections_up.length > 0 ? pattern.connections_up.map(id => `Pattern ${id}`).join(', ') : 'None'}
**Implementation (smaller scale):** ${pattern.connections_down.length > 0 ? pattern.connections_down.map(id => `Pattern ${id}`).join(', ') : 'None'}
`;
}

/**
 * Get connected patterns for context
 */
export function getConnectedPatterns(pattern: PatternInput): PatternInput[] {
  const allPatterns = loadPatternCatalog();
  const connectedIds = new Set([...pattern.connections_up, ...pattern.connections_down]);
  return allPatterns.filter((p) => connectedIds.has(p.id));
}

/**
 * Format connected patterns as brief context
 */
export function formatConnectedPatterns(pattern: PatternInput): string {
  const connected = getConnectedPatterns(pattern);
  if (connected.length === 0) return 'No connected patterns.';

  return connected
    .map((p) => {
      const direction = pattern.connections_up.includes(p.id) ? 'UP' : 'DOWN';
      return `- Pattern ${p.number} (${p.name}) [${direction}]: ${p.problem.substring(0, 100)}...`;
    })
    .join('\n');
}
