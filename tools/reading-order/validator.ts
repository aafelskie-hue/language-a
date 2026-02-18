/**
 * Validation Checks for Reading Order Assignment
 */

import { PatternInput, Scale } from '../network-checker/types';

export interface ValidationResult {
  valid: boolean;
  completeness: {
    expectedCount: number;
    actualCount: number;
    gaps: number[];
    duplicates: number[];
  };
  scaleOrdering: {
    valid: boolean;
    neighborhoodRange: [number, number];
    buildingRange: [number, number];
    constructionRange: [number, number];
    violations: string[];
  };
  forwardReferenceRatio: {
    total: number;
    satisfied: number;
    ratio: number;
    target: number;
    met: boolean;
  };
  crossScaleDirection: {
    correct: number;
    violations: { patternId: number; refId: number; direction: string }[];
  };
  boundaryAssessment: {
    neighborhoodToBuilding: {
      lastNeighborhood: number[];
      firstBuilding: number[];
      connections: number;
    };
    buildingToConstruction: {
      lastBuilding: number[];
      firstConstruction: number[];
      connections: number;
    };
  };
}

export interface PatternWithOrder extends PatternInput {
  reading_order: number;
}

/**
 * Validate the complete reading order assignment
 */
export function validateReadingOrder(
  patterns: PatternWithOrder[]
): ValidationResult {
  const expectedCount = patterns.length;
  const orders = patterns.map(p => p.reading_order);
  const orderSet = new Set(orders);

  // Check for gaps and duplicates
  const gaps: number[] = [];
  for (let i = 1; i <= expectedCount; i++) {
    if (!orderSet.has(i)) {
      gaps.push(i);
    }
  }

  const seen = new Map<number, number>();
  const duplicates: number[] = [];
  for (const order of orders) {
    const count = (seen.get(order) || 0) + 1;
    seen.set(order, count);
    if (count === 2) {
      duplicates.push(order);
    }
  }

  // Group by scale
  const byScale: Record<Scale, PatternWithOrder[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };
  for (const p of patterns) {
    byScale[p.scale].push(p);
  }

  // Check scale ordering
  const neighborhoodOrders = byScale.neighborhood.map(p => p.reading_order);
  const buildingOrders = byScale.building.map(p => p.reading_order);
  const constructionOrders = byScale.construction.map(p => p.reading_order);

  const neighborhoodMax = Math.max(...neighborhoodOrders);
  const neighborhoodMin = Math.min(...neighborhoodOrders);
  const buildingMax = Math.max(...buildingOrders);
  const buildingMin = Math.min(...buildingOrders);
  const constructionMax = Math.max(...constructionOrders);
  const constructionMin = Math.min(...constructionOrders);

  const scaleViolations: string[] = [];
  if (neighborhoodMax >= buildingMin) {
    scaleViolations.push(
      `Neighborhood max (${neighborhoodMax}) >= Building min (${buildingMin})`
    );
  }
  if (buildingMax >= constructionMin) {
    scaleViolations.push(
      `Building max (${buildingMax}) >= Construction min (${constructionMin})`
    );
  }

  // Build order lookup
  const orderLookup = new Map<number, number>();
  for (const p of patterns) {
    orderLookup.set(p.id, p.reading_order);
  }

  // Calculate forward reference ratio
  let totalRefs = 0;
  let satisfiedRefs = 0;
  for (const p of patterns) {
    for (const upId of p.connections_up) {
      const upOrder = orderLookup.get(upId);
      if (upOrder !== undefined) {
        totalRefs++;
        if (upOrder < p.reading_order) {
          satisfiedRefs++;
        }
      }
    }
  }

  // Check cross-scale direction
  const scaleLookup = new Map<number, Scale>();
  for (const p of patterns) {
    scaleLookup.set(p.id, p.scale);
  }

  const scaleOrder: Record<Scale, number> = {
    neighborhood: 0,
    building: 1,
    construction: 2,
  };

  let correctCrossScale = 0;
  const crossScaleViolations: {
    patternId: number;
    refId: number;
    direction: string;
  }[] = [];

  for (const p of patterns) {
    const pScaleNum = scaleOrder[p.scale];

    for (const upId of p.connections_up) {
      const upScale = scaleLookup.get(upId);
      if (upScale && upScale !== p.scale) {
        const upScaleNum = scaleOrder[upScale];
        if (upScaleNum < pScaleNum) {
          correctCrossScale++;
        } else {
          crossScaleViolations.push({
            patternId: p.id,
            refId: upId,
            direction: `up to ${upScale} from ${p.scale}`,
          });
        }
      }
    }
  }

  // Boundary assessment
  const sortedNeighborhood = [...byScale.neighborhood].sort(
    (a, b) => b.reading_order - a.reading_order
  );
  const sortedBuilding = [...byScale.building].sort(
    (a, b) => a.reading_order - b.reading_order
  );
  const sortedConstruction = [...byScale.construction].sort(
    (a, b) => a.reading_order - b.reading_order
  );

  const lastNeighborhood = sortedNeighborhood.slice(0, 3).map(p => p.id);
  const firstBuilding = sortedBuilding.slice(0, 3).map(p => p.id);
  const lastBuilding = [...byScale.building]
    .sort((a, b) => b.reading_order - a.reading_order)
    .slice(0, 3)
    .map(p => p.id);
  const firstConstruction = sortedConstruction.slice(0, 3).map(p => p.id);

  // Count connections across boundaries
  let nbConnections = 0;
  let bcConnections = 0;

  for (const p of patterns) {
    if (lastNeighborhood.includes(p.id)) {
      for (const downId of p.connections_down) {
        if (firstBuilding.includes(downId)) {
          nbConnections++;
        }
      }
    }
    if (lastBuilding.includes(p.id)) {
      for (const downId of p.connections_down) {
        if (firstConstruction.includes(downId)) {
          bcConnections++;
        }
      }
    }
  }

  const forwardRatio = totalRefs > 0 ? satisfiedRefs / totalRefs : 1;

  return {
    valid:
      gaps.length === 0 &&
      duplicates.length === 0 &&
      scaleViolations.length === 0,
    completeness: {
      expectedCount,
      actualCount: orderSet.size,
      gaps,
      duplicates,
    },
    scaleOrdering: {
      valid: scaleViolations.length === 0,
      neighborhoodRange: [neighborhoodMin, neighborhoodMax],
      buildingRange: [buildingMin, buildingMax],
      constructionRange: [constructionMin, constructionMax],
      violations: scaleViolations,
    },
    forwardReferenceRatio: {
      total: totalRefs,
      satisfied: satisfiedRefs,
      ratio: forwardRatio,
      target: 0.7,
      met: forwardRatio >= 0.7,
    },
    crossScaleDirection: {
      correct: correctCrossScale,
      violations: crossScaleViolations,
    },
    boundaryAssessment: {
      neighborhoodToBuilding: {
        lastNeighborhood,
        firstBuilding,
        connections: nbConnections,
      },
      buildingToConstruction: {
        lastBuilding,
        firstConstruction,
        connections: bcConnections,
      },
    },
  };
}
