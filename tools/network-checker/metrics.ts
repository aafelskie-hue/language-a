/**
 * Network Checker Metrics
 * Network metric calculations
 */

import type { NetworkNode, NetworkEdge, NetworkCluster, Scale } from './types.js';

/**
 * Calculate reciprocity rate
 */
export function calculateReciprocity(nodes: NetworkNode[]): {
  totalDirected: number;
  reciprocalPairs: number;
  reciprocityRate: number;
  oneWay: { from: number; to: number }[];
} {
  const edgePairs = new Map<string, boolean>();
  const oneWay: { from: number; to: number }[] = [];
  let totalDirected = 0;
  let reciprocalPairs = 0;

  // Build edge map
  for (const node of nodes) {
    for (const toId of node.allConnections) {
      const key = `${node.id}-${toId}`;
      const reverseKey = `${toId}-${node.id}`;
      edgePairs.set(key, edgePairs.has(reverseKey));
      totalDirected++;
    }
  }

  // Count reciprocal and one-way
  for (const [key, isReciprocal] of edgePairs) {
    if (isReciprocal) {
      reciprocalPairs++;
    } else {
      const [from, to] = key.split('-').map(Number);
      oneWay.push({ from, to });
    }
  }

  // Reciprocal pairs are counted twice, so divide by 2
  reciprocalPairs = Math.floor(reciprocalPairs / 2);

  const reciprocityRate = totalDirected > 0
    ? (reciprocalPairs * 2) / totalDirected
    : 0;

  return {
    totalDirected,
    reciprocalPairs,
    reciprocityRate,
    oneWay: oneWay.slice(0, 20), // Limit to first 20 for display
  };
}

/**
 * Calculate scale flow percentages
 */
export function measureScaleFlow(nodes: NetworkNode[]): {
  neighborhoodToBuilding: number;
  buildingToConstruction: number;
} {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const neighborhoodNodes = nodes.filter(n => n.scale === 'neighborhood');
  const buildingNodes = nodes.filter(n => n.scale === 'building');

  // Neighborhood → Building
  let neighborhoodWithBuilding = 0;
  for (const node of neighborhoodNodes) {
    const hasBuilding = node.allConnections.some(id => {
      const conn = nodeMap.get(id);
      return conn && conn.scale === 'building';
    });
    if (hasBuilding) neighborhoodWithBuilding++;
  }

  // Building → Construction
  let buildingWithConstruction = 0;
  for (const node of buildingNodes) {
    const hasConstruction = node.allConnections.some(id => {
      const conn = nodeMap.get(id);
      return conn && conn.scale === 'construction';
    });
    if (hasConstruction) buildingWithConstruction++;
  }

  return {
    neighborhoodToBuilding: neighborhoodNodes.length > 0
      ? (neighborhoodWithBuilding / neighborhoodNodes.length) * 100
      : 0,
    buildingToConstruction: buildingNodes.length > 0
      ? (buildingWithConstruction / buildingNodes.length) * 100
      : 0,
  };
}

/**
 * Calculate category balance score using normalized entropy
 */
export function calculateBalanceScore(distribution: Record<string, number>): number {
  const values = Object.values(distribution).filter(v => v > 0);
  if (values.length <= 1) return 1;

  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 1;

  const maxEntropy = Math.log(values.length);
  const entropy = -values.reduce((sum, v) => {
    const p = v / total;
    return p > 0 ? sum + p * Math.log(p) : sum;
  }, 0);

  return maxEntropy > 0 ? entropy / maxEntropy : 1;
}

/**
 * Calculate category distribution
 */
export function calculateCategoryDistribution(nodes: NetworkNode[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const node of nodes) {
    distribution[node.category] = (distribution[node.category] || 0) + 1;
  }

  return distribution;
}

/**
 * Detect clusters using simple connected component analysis
 */
export function detectClusters(nodes: NetworkNode[]): NetworkCluster[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const allIds = new Set(nodes.map(n => n.id));

  // Find strongly connected components (simplified: groups with high internal connectivity)
  const clusters: NetworkCluster[] = [];
  const visited = new Set<number>();

  // Group by category first as a heuristic
  const categoryGroups = new Map<string, number[]>();
  for (const node of nodes) {
    if (!categoryGroups.has(node.category)) {
      categoryGroups.set(node.category, []);
    }
    categoryGroups.get(node.category)!.push(node.id);
  }

  for (const [category, patternIds] of categoryGroups) {
    if (patternIds.length < 3) continue; // Skip small groups

    let internalConnections = 0;
    let externalConnections = 0;

    for (const id of patternIds) {
      const node = nodeMap.get(id)!;
      for (const connId of node.allConnections) {
        if (!allIds.has(connId)) continue; // Skip dead refs
        if (patternIds.includes(connId)) {
          internalConnections++;
        } else {
          externalConnections++;
        }
      }
    }

    const total = internalConnections + externalConnections;
    const ratio = total > 0 ? externalConnections / total : 0;

    clusters.push({
      patterns: patternIds,
      internalConnections,
      externalConnections,
      ratio,
      isolated: ratio < 0.3,
    });
  }

  return clusters.sort((a, b) => a.ratio - b.ratio);
}

/**
 * Calculate Alexander integration metrics
 */
export function calculateAlexanderIntegration(nodes: NetworkNode[]): {
  patternsWithRefs: number;
  patternsWithoutRefs: number[];
  mostReferenced: { alexanderId: number; count: number }[];
} {
  const withRefs: number[] = [];
  const withoutRefs: number[] = [];
  const refCounts = new Map<number, number>();

  for (const node of nodes) {
    if (node.alexanderRefs.length > 0) {
      withRefs.push(node.id);
      for (const ref of node.alexanderRefs) {
        refCounts.set(ref, (refCounts.get(ref) || 0) + 1);
      }
    } else {
      withoutRefs.push(node.id);
    }
  }

  const mostReferenced = [...refCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([alexanderId, count]) => ({ alexanderId, count }));

  return {
    patternsWithRefs: withRefs.length,
    patternsWithoutRefs: withoutRefs,
    mostReferenced,
  };
}

/**
 * Calculate connectivity statistics
 */
export function calculateConnectivity(nodes: NetworkNode[]): {
  totalConnections: number;
  averagePerPattern: number;
} {
  let totalConnections = 0;
  for (const node of nodes) {
    totalConnections += node.connectionCount;
  }

  return {
    totalConnections,
    averagePerPattern: nodes.length > 0 ? totalConnections / nodes.length : 0,
  };
}
