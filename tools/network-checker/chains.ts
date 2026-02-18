/**
 * Network Checker Chains
 * Vertical chain detection and analysis
 */

import type { NetworkNode, VerticalChain, Scale } from './types.js';

/**
 * Find all vertical chains in the network
 * A vertical chain flows: neighborhood → building → construction
 */
export function findVerticalChains(nodes: NetworkNode[]): {
  complete: VerticalChain[];
  broken: VerticalChain[];
  floating: number[];
} {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const neighborhoodNodes = nodes.filter(n => n.scale === 'neighborhood');
  const buildingNodes = nodes.filter(n => n.scale === 'building');
  const constructionNodes = nodes.filter(n => n.scale === 'construction');

  const complete: VerticalChain[] = [];
  const broken: VerticalChain[] = [];
  const inChain = new Set<number>();

  // Start from neighborhood patterns and follow down
  for (const nNode of neighborhoodNodes) {
    const chain = buildChainFromNeighborhood(nNode, nodeMap);

    if (chain.neighborhood.length > 0) {
      chain.neighborhood.forEach(id => inChain.add(id));
      chain.building.forEach(id => inChain.add(id));
      chain.construction.forEach(id => inChain.add(id));

      if (chain.complete) {
        complete.push(chain);
      } else {
        broken.push(chain);
      }
    }
  }

  // Find building patterns not connected to any neighborhood
  for (const bNode of buildingNodes) {
    if (inChain.has(bNode.id)) continue;

    const chain = buildChainFromBuilding(bNode, nodeMap);
    chain.building.forEach(id => inChain.add(id));
    chain.construction.forEach(id => inChain.add(id));

    // This is a broken chain (no neighborhood context)
    broken.push(chain);
  }

  // Find construction patterns not in any chain
  for (const cNode of constructionNodes) {
    if (inChain.has(cNode.id)) continue;

    const chain: VerticalChain = {
      neighborhood: [],
      building: [],
      construction: [cNode.id],
      complete: false,
      strength: 0,
    };
    broken.push(chain);
    inChain.add(cNode.id);
  }

  // Find floating patterns (not in any chain)
  const floating = nodes
    .filter(n => !inChain.has(n.id))
    .map(n => n.id);

  return { complete, broken, floating };
}

/**
 * Build a chain starting from a neighborhood node
 */
function buildChainFromNeighborhood(
  startNode: NetworkNode,
  nodeMap: Map<number, NetworkNode>
): VerticalChain {
  const neighborhood: number[] = [startNode.id];
  const building: number[] = [];
  const construction: number[] = [];
  const visited = new Set<number>([startNode.id]);

  // Find connected building patterns
  for (const connId of startNode.allConnections) {
    const connNode = nodeMap.get(connId);
    if (connNode && connNode.scale === 'building' && !visited.has(connId)) {
      building.push(connId);
      visited.add(connId);

      // Find construction patterns connected to this building
      for (const buildConnId of connNode.allConnections) {
        const buildConnNode = nodeMap.get(buildConnId);
        if (buildConnNode && buildConnNode.scale === 'construction' && !visited.has(buildConnId)) {
          construction.push(buildConnId);
          visited.add(buildConnId);
        }
      }
    }
  }

  // Also check neighborhood's direct construction connections
  for (const connId of startNode.allConnections) {
    const connNode = nodeMap.get(connId);
    if (connNode && connNode.scale === 'construction' && !visited.has(connId)) {
      construction.push(connId);
      visited.add(connId);
    }
  }

  const complete = neighborhood.length > 0 && building.length > 0 && construction.length > 0;
  const strength = calculateChainStrength(neighborhood, building, construction, nodeMap);

  return { neighborhood, building, construction, complete, strength };
}

/**
 * Build a chain starting from a building node (no neighborhood context)
 */
function buildChainFromBuilding(
  startNode: NetworkNode,
  nodeMap: Map<number, NetworkNode>
): VerticalChain {
  const neighborhood: number[] = [];
  const building: number[] = [startNode.id];
  const construction: number[] = [];
  const visited = new Set<number>([startNode.id]);

  // Check for neighborhood connections (upward)
  for (const connId of startNode.allConnections) {
    const connNode = nodeMap.get(connId);
    if (connNode && connNode.scale === 'neighborhood' && !visited.has(connId)) {
      neighborhood.push(connId);
      visited.add(connId);
    }
  }

  // Find construction patterns (downward)
  for (const connId of startNode.allConnections) {
    const connNode = nodeMap.get(connId);
    if (connNode && connNode.scale === 'construction' && !visited.has(connId)) {
      construction.push(connId);
      visited.add(connId);
    }
  }

  const complete = neighborhood.length > 0 && building.length > 0 && construction.length > 0;
  const strength = calculateChainStrength(neighborhood, building, construction, nodeMap);

  return { neighborhood, building, construction, complete, strength };
}

/**
 * Calculate chain strength based on connection density
 */
function calculateChainStrength(
  neighborhood: number[],
  building: number[],
  construction: number[],
  nodeMap: Map<number, NetworkNode>
): number {
  const allIds = [...neighborhood, ...building, ...construction];
  if (allIds.length <= 1) return 0;

  let internalConnections = 0;
  let maxPossibleConnections = allIds.length * (allIds.length - 1);

  for (const id of allIds) {
    const node = nodeMap.get(id);
    if (node) {
      for (const connId of node.allConnections) {
        if (allIds.includes(connId)) {
          internalConnections++;
        }
      }
    }
  }

  return maxPossibleConnections > 0 ? internalConnections / maxPossibleConnections : 0;
}

/**
 * Get the strongest chains for display
 */
export function getStrongestChains(
  chains: VerticalChain[],
  nodes: NetworkNode[],
  limit: number = 5
): Array<{ chain: VerticalChain; names: { n: string[]; b: string[]; c: string[] } }> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return chains
    .filter(c => c.complete)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map(chain => ({
      chain,
      names: {
        n: chain.neighborhood.map(id => nodeMap.get(id)?.name || `#${id}`),
        b: chain.building.map(id => nodeMap.get(id)?.name || `#${id}`),
        c: chain.construction.map(id => nodeMap.get(id)?.name || `#${id}`),
      },
    }));
}

/**
 * Get broken chains that need attention
 */
export function getBrokenChainsForRepair(
  chains: VerticalChain[],
  nodes: NetworkNode[],
  limit: number = 5
): Array<{
  chain: VerticalChain;
  missingNeighborhood: boolean;
  missingBuilding: boolean;
  missingConstruction: boolean;
  patternNames: string[];
}> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return chains
    .filter(c => !c.complete)
    .sort((a, b) => {
      // Prioritize chains with more existing patterns
      const aSize = a.neighborhood.length + a.building.length + a.construction.length;
      const bSize = b.neighborhood.length + b.building.length + b.construction.length;
      return bSize - aSize;
    })
    .slice(0, limit)
    .map(chain => ({
      chain,
      missingNeighborhood: chain.neighborhood.length === 0,
      missingBuilding: chain.building.length === 0,
      missingConstruction: chain.construction.length === 0,
      patternNames: [
        ...chain.neighborhood,
        ...chain.building,
        ...chain.construction,
      ].map(id => nodeMap.get(id)?.name || `#${id}`),
    }));
}
