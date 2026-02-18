/**
 * Pattern Generator Context
 * Gather context from catalog plan and existing patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PatternSlot, PatternInput, GenerationContext, Scale } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DRAFTS_DIR = path.resolve(process.cwd(), 'drafts');

/**
 * Load the catalog plan
 */
export function loadCatalogPlan(): PatternSlot[] {
  const planPath = path.join(DATA_DIR, 'catalog-plan.json');
  if (!fs.existsSync(planPath)) {
    throw new Error(`Catalog plan not found: ${planPath}`);
  }
  return JSON.parse(fs.readFileSync(planPath, 'utf-8'));
}

/**
 * Load existing patterns
 */
export function loadPatterns(): PatternInput[] {
  const patternsPath = path.join(DATA_DIR, 'patterns.json');
  if (!fs.existsSync(patternsPath)) {
    throw new Error(`Patterns file not found: ${patternsPath}`);
  }
  return JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
}

/**
 * Get a slot by ID from the catalog plan
 */
export function getSlotById(id: number): PatternSlot | null {
  const plan = loadCatalogPlan();
  return plan.find(s => s.id === id) || null;
}

/**
 * Get a pattern by ID from existing patterns
 */
export function getPatternById(id: number): PatternInput | null {
  const patterns = loadPatterns();
  return patterns.find(p => p.id === id) || null;
}

/**
 * Build generation context for a pattern slot
 */
export function buildContext(
  slotId: number,
  options: {
    andrewContext?: string;
    existingDraft?: string;
    redTeamFeedback?: string;
  } = {}
): GenerationContext {
  const plan = loadCatalogPlan();
  const patterns = loadPatterns();

  const slot = plan.find(s => s.id === slotId);
  if (!slot) {
    throw new Error(`Slot ${slotId} not found in catalog plan`);
  }

  // Build maps for quick lookup
  const patternMap = new Map(patterns.map(p => [p.id, p]));
  const slotMap = new Map(plan.map(s => [s.id, s]));

  // Get connected patterns (full text for existing ones)
  const connectedPatterns: PatternInput[] = [];
  for (const connId of slot.connections) {
    const pattern = patternMap.get(connId);
    if (pattern) {
      connectedPatterns.push(pattern);
    }
  }

  // Get patterns in same category
  const categoryPatterns = patterns.filter(p => p.category === slot.category);

  // Get patterns at same scale
  const scaleNeighbors = patterns.filter(p => p.scale === slot.scale);

  // Build vertical chain
  const verticalChain = buildVerticalChain(slot, slotMap, patternMap);

  // Check for existing draft
  let existingDraft = options.existingDraft;
  if (!existingDraft) {
    const draftPath = getDraftPath(slot.id, slot.name);
    if (fs.existsSync(draftPath)) {
      existingDraft = fs.readFileSync(draftPath, 'utf-8');
    }
  }

  return {
    slot,
    connectedPatterns,
    categoryPatterns,
    scaleNeighbors,
    verticalChain,
    andrewContext: options.andrewContext,
    existingDraft,
    redTeamFeedback: options.redTeamFeedback,
  };
}

/**
 * Build the vertical chain for a slot
 */
function buildVerticalChain(
  slot: PatternSlot,
  slotMap: Map<number, PatternSlot>,
  patternMap: Map<number, PatternInput>
): { above: PatternSlot[]; below: PatternSlot[] } {
  const above: PatternSlot[] = [];
  const below: PatternSlot[] = [];

  const scaleOrder: Scale[] = ['neighborhood', 'building', 'construction'];
  const currentScaleIndex = scaleOrder.indexOf(slot.scale);

  // Find connected patterns at larger scale (above)
  for (const connId of slot.connections) {
    const connSlot = slotMap.get(connId);
    if (connSlot) {
      const connScaleIndex = scaleOrder.indexOf(connSlot.scale);
      if (connScaleIndex < currentScaleIndex) {
        above.push(connSlot);
      } else if (connScaleIndex > currentScaleIndex) {
        below.push(connSlot);
      }
    }
  }

  return { above, below };
}

/**
 * Get the draft file path for a pattern
 */
export function getDraftPath(id: number, name: string): string {
  const slug = slugify(name);
  const paddedId = String(id).padStart(3, '0');
  return path.join(DRAFTS_DIR, `${paddedId}-${slug}.md`);
}

/**
 * Get the research file path for a pattern
 */
export function getResearchPath(id: number, name: string): string {
  const slug = slugify(name);
  const paddedId = String(id).padStart(3, '0');
  return path.join(DRAFTS_DIR, `${paddedId}-${slug}.research.json`);
}

/**
 * Get the review file path for a pattern
 */
export function getReviewPath(id: number, name: string): string {
  const slug = slugify(name);
  const paddedId = String(id).padStart(3, '0');
  return path.join(DRAFTS_DIR, `${paddedId}-${slug}.review.json`);
}

/**
 * Slugify a pattern name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Save a draft to the drafts directory
 */
export function saveDraft(id: number, name: string, content: string): string {
  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  }

  const draftPath = getDraftPath(id, name);
  fs.writeFileSync(draftPath, content);
  return draftPath;
}

/**
 * Save research results
 */
export function saveResearch(id: number, name: string, research: object): string {
  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  }

  const researchPath = getResearchPath(id, name);
  fs.writeFileSync(researchPath, JSON.stringify(research, null, 2));
  return researchPath;
}

/**
 * Get planned slots by priority
 */
export function getSlotsByPriority(priority: 'high' | 'medium' | 'low'): PatternSlot[] {
  const plan = loadCatalogPlan();
  return plan.filter(s => s.status === 'planned' && s.priority === priority);
}

/**
 * Get planned slots by category
 */
export function getSlotsByCategory(category: string): PatternSlot[] {
  const plan = loadCatalogPlan();
  return plan.filter(s => s.status === 'planned' && s.category === category);
}

/**
 * Get planned slots in ID range
 */
export function getSlotsByRange(from: number, to: number): PatternSlot[] {
  const plan = loadCatalogPlan();
  return plan.filter(s => s.status === 'planned' && s.id >= from && s.id <= to);
}

/**
 * Get category label from category ID
 */
export function getCategoryLabel(categoryId: string): string {
  const categories: Record<string, string> = {
    'fifteen-minute-life': 'Patterns for the Fifteen-Minute Life',
    'digital-age-dwelling': 'Patterns for Dwelling in the Digital Age',
    'housing-diversity': 'Patterns for Housing Diversity',
    'climate-resilience': 'Patterns for Climate Resilience',
    'energy-envelope': 'Patterns for Energy and Envelope',
    'food-water': 'Patterns for Food and Water',
    'adaptive-reuse': 'Patterns for Adaptive Reuse',
    'health-biophilia': 'Patterns for Health and Biophilia',
    'foundation': 'Foundation Patterns',
    'community-governance': 'Patterns for Community Governance',
    'construction-making': 'Patterns for Construction and Making',
    'northern-living': 'Patterns for Northern and Cold-Climate Living',
    'water-infrastructure': 'Patterns for Water and Infrastructure',
    'children-play': 'Patterns for Children and Play',
    'aging-accessibility': 'Patterns for Aging and Accessibility',
    'light-darkness': 'Patterns for Light and Darkness',
    'sound-silence': 'Patterns for Sound and Silence',
    'the-commons': 'Patterns for the Commons',
    'density-done-right': 'Patterns for Density Done Right',
  };
  return categories[categoryId] || categoryId;
}
