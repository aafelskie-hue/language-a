/**
 * Category Planner Validator
 * Structural integrity checks for catalog plans
 */

import {
  type PatternSlot,
  type ValidationReport,
  type ScaleDistribution,
  type NetworkHealth,
  SCALE_TARGETS,
  TARGET_PATTERNS,
  CATEGORY_CAPACITIES,
} from './types.js';

/**
 * Validate a complete catalog plan
 */
export function validatePlan(slots: PatternSlot[]): ValidationReport {
  const issues: string[] = [];

  // Basic count check
  if (slots.length !== TARGET_PATTERNS) {
    issues.push(`Expected ${TARGET_PATTERNS} patterns, found ${slots.length}`);
  }

  // Run all validations
  const scaleDistribution = validateScaleDistribution(slots, issues);
  const categoryDistribution = validateCategoryDistribution(slots, issues);
  const networkHealth = validateNetworkHealth(slots, issues);
  const verticalChains = validateVerticalChains(slots, issues);
  const coldClimateRate = validateColdClimate(slots, issues);
  const duplicateNames = findDuplicateNames(slots);
  const emptyFields = findEmptyFields(slots);

  if (duplicateNames.length > 0) {
    issues.push(`Found ${duplicateNames.length} duplicate pattern names`);
  }

  if (emptyFields.length > 0) {
    issues.push(`Found ${emptyFields.length} patterns with empty required fields`);
  }

  // Determine verdict
  let verdict: ValidationReport['verdict'];
  const criticalIssues = issues.filter(i =>
    i.includes('Expected') ||
    i.includes('duplicate') ||
    i.includes('BELOW') ||
    i.includes('orphan')
  );

  if (criticalIssues.length > 0) {
    verdict = 'INVALID';
  } else if (issues.length > 0) {
    verdict = 'ISSUES';
  } else {
    verdict = 'VALID';
  }

  return {
    totalPatterns: slots.length,
    scaleDistribution,
    categoryDistribution,
    networkHealth,
    verticalChains,
    coldClimateRate,
    duplicateNames,
    emptyFields,
    verdict,
    issues,
  };
}

/**
 * Validate scale distribution
 */
export function validateScaleDistribution(
  slots: PatternSlot[],
  issues: string[]
): ScaleDistribution {
  const total = slots.length;

  const neighborhood = slots.filter(s => s.scale === 'neighborhood').length;
  const building = slots.filter(s => s.scale === 'building').length;
  const construction = slots.filter(s => s.scale === 'construction').length;

  const neighborhoodPct = total > 0 ? neighborhood / total : 0;
  const buildingPct = total > 0 ? building / total : 0;
  const constructionPct = total > 0 ? construction / total : 0;

  // Check against targets
  if (neighborhoodPct < SCALE_TARGETS.neighborhood.min) {
    issues.push(`Neighborhood scale BELOW target: ${(neighborhoodPct * 100).toFixed(0)}% (min ${(SCALE_TARGETS.neighborhood.min * 100).toFixed(0)}%)`);
  }
  if (neighborhoodPct > SCALE_TARGETS.neighborhood.max) {
    issues.push(`Neighborhood scale ABOVE target: ${(neighborhoodPct * 100).toFixed(0)}% (max ${(SCALE_TARGETS.neighborhood.max * 100).toFixed(0)}%)`);
  }

  if (buildingPct < SCALE_TARGETS.building.min) {
    issues.push(`Building scale BELOW target: ${(buildingPct * 100).toFixed(0)}% (min ${(SCALE_TARGETS.building.min * 100).toFixed(0)}%)`);
  }
  if (buildingPct > SCALE_TARGETS.building.max) {
    issues.push(`Building scale ABOVE target: ${(buildingPct * 100).toFixed(0)}% (max ${(SCALE_TARGETS.building.max * 100).toFixed(0)}%)`);
  }

  if (constructionPct < SCALE_TARGETS.construction.min) {
    issues.push(`Construction scale BELOW target: ${(constructionPct * 100).toFixed(0)}% (min ${(SCALE_TARGETS.construction.min * 100).toFixed(0)}%)`);
  }
  if (constructionPct > SCALE_TARGETS.construction.max) {
    issues.push(`Construction scale ABOVE target: ${(constructionPct * 100).toFixed(0)}% (max ${(SCALE_TARGETS.construction.max * 100).toFixed(0)}%)`);
  }

  return {
    neighborhood,
    building,
    construction,
    neighborhoodPct,
    buildingPct,
    constructionPct,
    total,
    targets: {
      neighborhoodMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.neighborhood.min),
      neighborhoodMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.neighborhood.max),
      buildingMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.building.min),
      buildingMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.building.max),
      constructionMin: Math.round(TARGET_PATTERNS * SCALE_TARGETS.construction.min),
      constructionMax: Math.round(TARGET_PATTERNS * SCALE_TARGETS.construction.max),
    },
  };
}

/**
 * Validate category distribution
 */
export function validateCategoryDistribution(
  slots: PatternSlot[],
  issues: string[]
): Record<string, { total: number; neighborhood: number; building: number; construction: number; hasMultipleScales: boolean }> {
  const result: Record<string, {
    total: number;
    neighborhood: number;
    building: number;
    construction: number;
    hasMultipleScales: boolean;
  }> = {};

  // Group by category
  const categories = new Set(slots.map(s => s.category));

  for (const categoryId of categories) {
    const categorySlots = slots.filter(s => s.category === categoryId);
    const neighborhood = categorySlots.filter(s => s.scale === 'neighborhood').length;
    const building = categorySlots.filter(s => s.scale === 'building').length;
    const construction = categorySlots.filter(s => s.scale === 'construction').length;

    const scaleCount = [neighborhood, building, construction].filter(c => c > 0).length;
    const hasMultipleScales = scaleCount >= 2;

    result[categoryId] = {
      total: categorySlots.length,
      neighborhood,
      building,
      construction,
      hasMultipleScales,
    };

    // Check for single-scale categories
    if (!hasMultipleScales && categorySlots.length >= 5) {
      issues.push(`Category "${categoryId}" has only one scale represented`);
    }

    // Check for empty categories
    if (categorySlots.length === 0) {
      issues.push(`Category "${categoryId}" has no patterns`);
    }

    // Check against capacity
    const capacity = CATEGORY_CAPACITIES[categoryId];
    if (capacity && categorySlots.length > capacity * 1.2) {
      issues.push(`Category "${categoryId}" exceeds recommended capacity: ${categorySlots.length} > ${capacity}`);
    }
  }

  return result;
}

/**
 * Validate network health
 */
export function validateNetworkHealth(
  slots: PatternSlot[],
  issues: string[]
): NetworkHealth {
  const slotIds = new Set(slots.map(s => s.id));
  const orphans: number[] = [];
  const hubs: number[] = [];
  const deadReferences: Array<{ from: number; to: number }> = [];

  let totalConnections = 0;
  let scaleCrossingConnections = 0;

  for (const slot of slots) {
    const connections = slot.connections || [];
    const connectionCount = connections.length;

    totalConnections += connectionCount;

    // Check for orphans (< 3 connections) - only for planned patterns
    if (connectionCount < 3 && slot.status === 'planned') {
      orphans.push(slot.id);
    }

    // Check for hubs (> 8 connections)
    if (connectionCount > 8) {
      hubs.push(slot.id);
    }

    // Check for dead references and scale crossings
    for (const connId of connections) {
      if (!slotIds.has(connId)) {
        deadReferences.push({ from: slot.id, to: connId });
      } else {
        // Check if this is a scale-crossing connection
        const connectedSlot = slots.find(s => s.id === connId);
        if (connectedSlot && connectedSlot.scale !== slot.scale) {
          scaleCrossingConnections++;
        }
      }
    }
  }

  const averageConnections = slots.length > 0 ? totalConnections / slots.length : 0;
  const scaleCrossingRate = totalConnections > 0 ? scaleCrossingConnections / totalConnections : 0;

  // Add issues
  if (orphans.length > 0) {
    issues.push(`${orphans.length} planned patterns have fewer than 3 connections (orphans)`);
  }

  if (hubs.length > 0) {
    issues.push(`${hubs.length} patterns have more than 8 connections (potential hubs)`);
  }

  if (deadReferences.length > 0) {
    issues.push(`${deadReferences.length} dead references to non-existent patterns`);
  }

  if (averageConnections < 4) {
    issues.push(`Average connections (${averageConnections.toFixed(1)}) below target of 4-6`);
  }

  if (scaleCrossingRate < 0.5) {
    issues.push(`Scale-crossing rate (${(scaleCrossingRate * 100).toFixed(0)}%) below 50%`);
  }

  return {
    averageConnections,
    orphans,
    hubs,
    deadReferences,
    scaleCrossingRate,
    totalConnections,
  };
}

/**
 * Validate vertical chains (neighborhood → building → construction)
 */
export function validateVerticalChains(
  slots: PatternSlot[],
  issues: string[]
): { complete: number; broken: Array<{ neighborhood: number; missingBuilding: boolean; missingConstruction: boolean }> } {
  const neighborhoodSlots = slots.filter(s => s.scale === 'neighborhood');
  const buildingSlots = slots.filter(s => s.scale === 'building');
  const constructionSlots = slots.filter(s => s.scale === 'construction');

  const buildingIds = new Set(buildingSlots.map(s => s.id));
  const constructionIds = new Set(constructionSlots.map(s => s.id));

  let complete = 0;
  const broken: Array<{ neighborhood: number; missingBuilding: boolean; missingConstruction: boolean }> = [];

  for (const nSlot of neighborhoodSlots) {
    const connections = nSlot.connections || [];

    // Check for building connections
    const hasBuildingConnection = connections.some(id => buildingIds.has(id));

    // Check for construction connections (directly or through building)
    let hasConstructionConnection = connections.some(id => constructionIds.has(id));

    // Also check if connected buildings connect to construction
    if (!hasConstructionConnection) {
      for (const connId of connections) {
        if (buildingIds.has(connId)) {
          const buildingSlot = buildingSlots.find(s => s.id === connId);
          if (buildingSlot) {
            const buildingConns = buildingSlot.connections || [];
            if (buildingConns.some(id => constructionIds.has(id))) {
              hasConstructionConnection = true;
              break;
            }
          }
        }
      }
    }

    if (hasBuildingConnection && hasConstructionConnection) {
      complete++;
    } else {
      broken.push({
        neighborhood: nSlot.id,
        missingBuilding: !hasBuildingConnection,
        missingConstruction: !hasConstructionConnection,
      });
    }
  }

  if (broken.length > 0) {
    issues.push(`${broken.length} neighborhood patterns have incomplete vertical chains`);
  }

  return { complete, broken };
}

/**
 * Validate cold climate coverage
 */
export function validateColdClimate(
  slots: PatternSlot[],
  issues: string[]
): number {
  const coldClimateCount = slots.filter(s => s.coldClimate).length;
  const rate = slots.length > 0 ? coldClimateCount / slots.length : 0;

  if (rate < 0.15) {
    issues.push(`Cold climate coverage (${(rate * 100).toFixed(0)}%) below 15% target`);
  }

  return rate;
}

/**
 * Find duplicate pattern names
 */
export function findDuplicateNames(slots: PatternSlot[]): string[] {
  const names = slots.map(s => s.name.toLowerCase());
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of names) {
    if (seen.has(name)) {
      duplicates.add(name);
    }
    seen.add(name);
  }

  return [...duplicates];
}

/**
 * Find slots with empty required fields
 */
export function findEmptyFields(slots: PatternSlot[]): Array<{ id: number; field: string }> {
  const result: Array<{ id: number; field: string }> = [];

  for (const slot of slots) {
    if (!slot.name || slot.name.includes('[Placeholder') || slot.name.includes('[Unnamed')) {
      result.push({ id: slot.id, field: 'name' });
    }
    if (!slot.brief && slot.status === 'planned') {
      result.push({ id: slot.id, field: 'brief' });
    }
    if (!slot.tension && slot.status === 'planned') {
      result.push({ id: slot.id, field: 'tension' });
    }
  }

  return result;
}
