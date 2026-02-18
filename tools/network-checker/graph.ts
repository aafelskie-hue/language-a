/**
 * Network Checker Graph
 * Build and analyze the pattern network graph
 */

import type { PatternInput, NetworkNode, NetworkEdge, Scale } from './types.js';

/**
 * Build the network graph from patterns
 */
export function buildGraph(patterns: PatternInput[]): {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
} {
  const nodes: NetworkNode[] = patterns.map(p => ({
    id: p.id,
    name: p.name,
    scale: p.scale,
    category: p.category,
    connectionsUp: p.connections_up || [],
    connectionsDown: p.connections_down || [],
    allConnections: [...new Set([...(p.connections_up || []), ...(p.connections_down || [])])],
    alexanderRefs: extractAlexanderRefs(p),
    connectionCount: new Set([...(p.connections_up || []), ...(p.connections_down || [])]).size,
  }));

  const edges: NetworkEdge[] = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    // Up connections
    for (const toId of node.connectionsUp) {
      const edgeKey = `${node.id}-${toId}`;
      if (!edgeSet.has(edgeKey)) {
        const reverseKey = `${toId}-${node.id}`;
        edges.push({
          from: node.id,
          to: toId,
          direction: 'up',
          reciprocal: edgeSet.has(reverseKey),
        });
        edgeSet.add(edgeKey);
      }
    }

    // Down connections
    for (const toId of node.connectionsDown) {
      const edgeKey = `${node.id}-${toId}`;
      if (!edgeSet.has(edgeKey)) {
        const reverseKey = `${toId}-${node.id}`;
        edges.push({
          from: node.id,
          to: toId,
          direction: 'down',
          reciprocal: edgeSet.has(reverseKey),
        });
        edgeSet.add(edgeKey);
      }
    }
  }

  // Update reciprocal status
  for (const edge of edges) {
    const reverseEdge = edges.find(e => e.from === edge.to && e.to === edge.from);
    if (reverseEdge) {
      edge.reciprocal = true;
      reverseEdge.reciprocal = true;
    }
  }

  return { nodes, edges };
}

/**
 * Extract Alexander pattern references from a pattern
 */
function extractAlexanderRefs(pattern: PatternInput): number[] {
  const refs: number[] = [];
  const text = `${pattern.problem} ${pattern.body} ${pattern.solution}`;

  // Look for "Alexander N", "Alexander pattern N", "Pattern N (Alexander)"
  const matches = text.matchAll(/Alexander\s+(?:pattern\s+)?(\d+)|pattern\s+(\d+)\s*\(Alexander\)/gi);
  for (const match of matches) {
    const num = parseInt(match[1] || match[2], 10);
    if (num >= 1 && num <= 253) {
      refs.push(num);
    }
  }

  return [...new Set(refs)];
}

/**
 * Find orphan patterns (< 3 connections)
 */
export function findOrphans(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.filter(n => n.connectionCount < 3);
}

/**
 * Find hub patterns (> 8 connections)
 */
export function findHubs(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.filter(n => n.connectionCount > 8);
}

/**
 * Find dead references (connections to non-existent patterns)
 */
export function findDeadReferences(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): { from: number; to: number }[] {
  const ids = new Set(nodes.map(n => n.id));
  const deadRefs: { from: number; to: number }[] = [];

  for (const node of nodes) {
    for (const connId of node.allConnections) {
      if (!ids.has(connId)) {
        deadRefs.push({ from: node.id, to: connId });
      }
    }
  }

  return deadRefs;
}

/**
 * Find scale-isolated patterns (only connected to same scale)
 */
export function findScaleIsolated(
  nodes: NetworkNode[]
): { id: number; name: string; scale: string }[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const isolated: { id: number; name: string; scale: string }[] = [];

  for (const node of nodes) {
    if (node.connectionCount === 0) continue;

    const connectedScales = new Set<Scale>();
    for (const connId of node.allConnections) {
      const connNode = nodeMap.get(connId);
      if (connNode) {
        connectedScales.add(connNode.scale);
      }
    }

    // Only connected to own scale
    if (connectedScales.size === 1 && connectedScales.has(node.scale)) {
      isolated.push({ id: node.id, name: node.name, scale: node.scale });
    }
  }

  return isolated;
}

/**
 * Get node by ID
 */
export function getNodeById(nodes: NetworkNode[], id: number): NetworkNode | undefined {
  return nodes.find(n => n.id === id);
}

/**
 * Get nodes by scale
 */
export function getNodesByScale(nodes: NetworkNode[], scale: Scale): NetworkNode[] {
  return nodes.filter(n => n.scale === scale);
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(nodes: NetworkNode[], category: string): NetworkNode[] {
  return nodes.filter(n => n.category === category);
}

/**
 * Check if two nodes are connected
 */
export function areConnected(nodeA: NetworkNode, nodeB: NetworkNode): boolean {
  return nodeA.allConnections.includes(nodeB.id) || nodeB.allConnections.includes(nodeA.id);
}
