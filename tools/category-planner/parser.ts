/**
 * Category Planner Parser
 * Data loading utilities for patterns and categories
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PatternInput, Category, PatternSlot } from './types.js';

// File paths
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DOCS_DIR = path.resolve(process.cwd(), 'docs');
const PATTERNS_PATH = path.join(DATA_DIR, 'patterns.json');
const CATEGORIES_PATH = path.join(DATA_DIR, 'categories.json');
const CATALOG_PLAN_PATH = path.join(DATA_DIR, 'catalog-plan.json');
const CATALOG_PLAN_MD_PATH = path.join(DOCS_DIR, 'catalog-plan.md');

/**
 * Load all patterns from the JSON catalog
 */
export function loadPatternCatalog(): PatternInput[] {
  const raw = fs.readFileSync(PATTERNS_PATH, 'utf-8');
  return JSON.parse(raw) as PatternInput[];
}

/**
 * Load all categories from the JSON catalog
 */
export function loadCategoryCatalog(): Category[] {
  const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
  return JSON.parse(raw) as Category[];
}

/**
 * Load the catalog plan if it exists
 */
export function loadCatalogPlan(customPath?: string): PatternSlot[] | null {
  const planPath = customPath || CATALOG_PLAN_PATH;

  if (!fs.existsSync(planPath)) {
    return null;
  }

  const raw = fs.readFileSync(planPath, 'utf-8');
  return JSON.parse(raw) as PatternSlot[];
}

/**
 * Save the catalog plan to JSON
 */
export function saveCatalogPlan(slots: PatternSlot[], customPath?: string): void {
  const planPath = customPath || CATALOG_PLAN_PATH;

  // Ensure data directory exists
  const dir = path.dirname(planPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(planPath, JSON.stringify(slots, null, 2));
}

/**
 * Save the markdown report
 */
export function saveMarkdownReport(content: string, customPath?: string): void {
  const reportPath = customPath || CATALOG_PLAN_MD_PATH;

  // Ensure docs directory exists
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(reportPath, content);
}

/**
 * Convert an existing pattern to a slot format
 */
export function patternToSlot(pattern: PatternInput): PatternSlot {
  return {
    id: pattern.id,
    name: pattern.name,
    scale: pattern.scale,
    category: pattern.category,
    status: 'existing',
    brief: pattern.problem.length > 100
      ? pattern.problem.substring(0, 100) + '...'
      : pattern.problem,
    tension: extractTension(pattern),
    connections: [...pattern.connections_up, ...pattern.connections_down],
    coldClimate: detectColdClimate(pattern),
    priority: 'medium', // Existing patterns have medium priority by default
  };
}

/**
 * Extract a tension statement from a pattern
 */
function extractTension(pattern: PatternInput): string {
  // Try to extract a tension from the problem statement
  const problem = pattern.problem;

  // Look for "When X, Y" patterns
  const whenMatch = problem.match(/^When\s+(.{20,100}),/i);
  if (whenMatch) {
    return problem.substring(0, 150);
  }

  // Otherwise, use first sentence of problem
  const firstSentence = problem.split(/[.!?]/)[0];
  return firstSentence.length > 150 ? firstSentence.substring(0, 150) + '...' : firstSentence;
}

/**
 * Detect if a pattern is cold-climate relevant
 */
function detectColdClimate(pattern: PatternInput): boolean {
  const keywords = [
    'cold', 'winter', 'frost', 'snow', 'thermal', 'insulation',
    'heating', 'envelope', 'northern', 'edmonton', '-30', 'freeze',
    'ice', 'arctic', 'boreal'
  ];

  const text = `${pattern.problem} ${pattern.body} ${pattern.solution}`.toLowerCase();

  return keywords.some(keyword => text.includes(keyword));
}

/**
 * Get a pattern by ID from the catalog
 */
export function getPatternById(id: number): PatternInput | null {
  const patterns = loadPatternCatalog();
  return patterns.find(p => p.id === id) || null;
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: string): Category | null {
  const categories = loadCategoryCatalog();
  return categories.find(c => c.id === id) || null;
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(categoryId: string): PatternInput[] {
  const patterns = loadPatternCatalog();
  return patterns.filter(p => p.category === categoryId);
}

/**
 * Get patterns by scale
 */
export function getPatternsByScale(scale: PatternInput['scale']): PatternInput[] {
  const patterns = loadPatternCatalog();
  return patterns.filter(p => p.scale === scale);
}

/**
 * Export paths for testing
 */
export const paths = {
  patterns: PATTERNS_PATH,
  categories: CATEGORIES_PATH,
  catalogPlan: CATALOG_PLAN_PATH,
  catalogPlanMd: CATALOG_PLAN_MD_PATH,
};
