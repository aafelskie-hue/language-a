#!/usr/bin/env node
/**
 * Fix catalog plan validation issues:
 * 1. Incomplete vertical chains
 * 2. Low scale-crossing rate
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PatternSlot, Scale } from './types.js';

const PLAN_PATH = path.resolve(process.cwd(), 'data/catalog-plan.json');

// Load the plan
const slots: PatternSlot[] = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));

console.log('Fixing catalog plan validation issues...\n');
console.log(`Loaded ${slots.length} patterns\n`);

// Index patterns by scale and ID
const slotById = new Map(slots.map(s => [s.id, s]));
const neighborhoodSlots = slots.filter(s => s.scale === 'neighborhood');
const buildingSlots = slots.filter(s => s.scale === 'building');
const constructionSlots = slots.filter(s => s.scale === 'construction');

const neighborhoodIds = new Set(neighborhoodSlots.map(s => s.id));
const buildingIds = new Set(buildingSlots.map(s => s.id));
const constructionIds = new Set(constructionSlots.map(s => s.id));

// ============================================================
// 1. FIX INCOMPLETE VERTICAL CHAINS (including existing patterns)
// ============================================================
console.log('1. Fixing incomplete vertical chains...');

let chainsFixed = 0;

for (const nSlot of neighborhoodSlots) {
  const connections = [...(nSlot.connections || [])];
  const hasBuildingConnection = connections.some(id => buildingIds.has(id));

  if (!hasBuildingConnection) {
    // Find a building pattern in the same category
    let targetBuilding = buildingSlots.find(
      b => b.category === nSlot.category && !connections.includes(b.id)
    );

    // If none in same category, find ANY building pattern
    if (!targetBuilding) {
      targetBuilding = buildingSlots.find(
        b => !connections.includes(b.id)
      );
    }

    if (targetBuilding) {
      nSlot.connections = [...connections, targetBuilding.id];

      // Add reverse connection (only for planned patterns)
      if (targetBuilding.status === 'planned') {
        targetBuilding.connections = targetBuilding.connections || [];
        if (!targetBuilding.connections.includes(nSlot.id)) {
          targetBuilding.connections = [...targetBuilding.connections, nSlot.id];
        }
      }

      chainsFixed++;
      console.log(`  Connected N:${nSlot.id} "${nSlot.name}" → B:${targetBuilding.id} "${targetBuilding.name}"`);
    }
  }
}

console.log(`  Fixed ${chainsFixed} incomplete vertical chains\n`);

// ============================================================
// 2. IMPROVE SCALE-CROSSING CONNECTIONS
// ============================================================
console.log('2. Improving scale-crossing connections...');

let crossingsAdded = 0;

// For building patterns: ensure connection to at least one neighborhood AND one construction
for (const bSlot of buildingSlots) {
  if (bSlot.status === 'existing') continue;

  const connections = [...(bSlot.connections || [])];

  // Check for neighborhood connection
  const hasNeighborhoodConnection = connections.some(id => neighborhoodIds.has(id));
  if (!hasNeighborhoodConnection) {
    const targetNeighborhood = neighborhoodSlots.find(
      n => n.category === bSlot.category && !connections.includes(n.id)
    ) || neighborhoodSlots.find(
      n => !connections.includes(n.id)
    );

    if (targetNeighborhood) {
      connections.push(targetNeighborhood.id);
      crossingsAdded++;
    }
  }

  // Check for construction connection
  const hasConstructionConnection = connections.some(id => constructionIds.has(id));
  if (!hasConstructionConnection) {
    const targetConstruction = constructionSlots.find(
      c => c.category === bSlot.category && !connections.includes(c.id)
    ) || constructionSlots.find(
      c => !connections.includes(c.id)
    );

    if (targetConstruction) {
      connections.push(targetConstruction.id);
      crossingsAdded++;

      // Add reverse connection
      targetConstruction.connections = targetConstruction.connections || [];
      if (!targetConstruction.connections.includes(bSlot.id)) {
        targetConstruction.connections = [...targetConstruction.connections, bSlot.id];
      }
    }
  }

  bSlot.connections = connections;
}

// For neighborhood patterns: ensure connection to building
for (const nSlot of neighborhoodSlots) {
  if (nSlot.status === 'existing') continue;

  const connections = [...(nSlot.connections || [])];
  const hasBuildingConnection = connections.some(id => buildingIds.has(id));

  if (!hasBuildingConnection) {
    const targetBuilding = buildingSlots.find(
      b => b.category === nSlot.category && !connections.includes(b.id)
    ) || buildingSlots.find(
      b => !connections.includes(b.id)
    );

    if (targetBuilding) {
      connections.push(targetBuilding.id);
      nSlot.connections = connections;
      crossingsAdded++;
    }
  }
}

// For construction patterns: ensure connection to building
for (const cSlot of constructionSlots) {
  if (cSlot.status === 'existing') continue;

  const connections = [...(cSlot.connections || [])];
  const hasBuildingConnection = connections.some(id => buildingIds.has(id));

  if (!hasBuildingConnection) {
    const targetBuilding = buildingSlots.find(
      b => b.category === cSlot.category && !connections.includes(b.id)
    ) || buildingSlots.find(
      b => !connections.includes(b.id)
    );

    if (targetBuilding) {
      connections.push(targetBuilding.id);
      cSlot.connections = connections;
      crossingsAdded++;
    }
  }
}

console.log(`  Added ${crossingsAdded} scale-crossing connections\n`);

// ============================================================
// 3. REDUCE HUB PATTERNS (> 8 connections)
// ============================================================
console.log('3. Reducing hub patterns...');

let hubsFixed = 0;
const maxConnections = 8;

for (const slot of slots) {
  if (slot.status === 'existing') continue;

  const connections = slot.connections || [];
  if (connections.length > maxConnections) {
    // Keep the most important connections (first 8)
    // Prioritize connections to different scales
    const sortedConnections = connections.sort((a, b) => {
      const aSlot = slotById.get(a);
      const bSlot = slotById.get(b);
      // Prioritize cross-scale connections
      const aIsCrossScale = aSlot && aSlot.scale !== slot.scale ? 1 : 0;
      const bIsCrossScale = bSlot && bSlot.scale !== slot.scale ? 1 : 0;
      return bIsCrossScale - aIsCrossScale;
    });

    slot.connections = sortedConnections.slice(0, maxConnections);
    hubsFixed++;
  }
}

console.log(`  Reduced ${hubsFixed} hub patterns to ≤${maxConnections} connections\n`);

// ============================================================
// 4. CALCULATE NEW SCALE-CROSSING RATE
// ============================================================
console.log('3. Calculating new metrics...');

let totalConnections = 0;
let scaleCrossing = 0;

for (const slot of slots) {
  const connections = slot.connections || [];
  for (const connId of connections) {
    const connSlot = slotById.get(connId);
    if (connSlot) {
      totalConnections++;
      if (connSlot.scale !== slot.scale) {
        scaleCrossing++;
      }
    }
  }
}

const scaleCrossingRate = totalConnections > 0 ? (scaleCrossing / totalConnections) * 100 : 0;
console.log(`  Scale-crossing rate: ${scaleCrossingRate.toFixed(0)}%\n`);

// ============================================================
// SAVE THE FIXED PLAN
// ============================================================

// Sort by ID
slots.sort((a, b) => a.id - b.id);

fs.writeFileSync(PLAN_PATH, JSON.stringify(slots, null, 2));
console.log(`Saved fixed plan to ${PLAN_PATH}`);

// Summary
const finalNeighborhood = slots.filter(s => s.scale === 'neighborhood').length;
const finalBuilding = slots.filter(s => s.scale === 'building').length;
const finalConstruction = slots.filter(s => s.scale === 'construction').length;

console.log(`\nFinal counts:`);
console.log(`  Total: ${slots.length}`);
console.log(`  Neighborhood:  ${finalNeighborhood} (${((finalNeighborhood / slots.length) * 100).toFixed(0)}%)`);
console.log(`  Building:      ${finalBuilding} (${((finalBuilding / slots.length) * 100).toFixed(0)}%)`);
console.log(`  Construction:  ${finalConstruction} (${((finalConstruction / slots.length) * 100).toFixed(0)}%)`);
