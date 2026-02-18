/**
 * Network Checker Types
 * TypeScript interfaces for network integrity analysis
 */

export type Scale = 'neighborhood' | 'building' | 'construction';

export interface NetworkNode {
  id: number;
  name: string;
  scale: Scale;
  category: string;
  connectionsUp: number[];
  connectionsDown: number[];
  allConnections: number[];
  alexanderRefs: number[];
  connectionCount: number;
}

export interface NetworkEdge {
  from: number;
  to: number;
  direction: 'up' | 'down';
  reciprocal: boolean;
}

export interface VerticalChain {
  neighborhood: number[];
  building: number[];
  construction: number[];
  complete: boolean;
  strength: number;
}

export interface NetworkCluster {
  patterns: number[];
  internalConnections: number;
  externalConnections: number;
  ratio: number;
  isolated: boolean;
}

export interface NetworkReport {
  timestamp: string;
  totalPatterns: number;

  connectivity: {
    totalConnections: number;
    averagePerPattern: number;
    orphans: { id: number; name: string; connections: number }[];
    hubs: { id: number; name: string; connections: number }[];
  };

  scaleFlow: {
    neighborhoodToBuilding: number;
    buildingToConstruction: number;
    scaleIsolated: { id: number; name: string; scale: string }[];
  };

  verticalChains: {
    complete: VerticalChain[];
    broken: VerticalChain[];
    floating: number[];
  };

  categoryBalance: {
    distribution: Record<string, number>;
    balanceScore: number;
  };

  reciprocity: {
    totalDirected: number;
    reciprocalPairs: number;
    reciprocityRate: number;
    oneWay: { from: number; to: number }[];
  };

  clusters: NetworkCluster[];

  alexanderIntegration: {
    patternsWithRefs: number;
    patternsWithoutRefs: number[];
    mostReferenced: { alexanderId: number; count: number }[];
  };

  deadReferences: { from: number; to: number }[];

  verdict: 'HEALTHY' | 'ISSUES' | 'CRITICAL';
  criticalCount: number;
  advisoryCount: number;
  issues: {
    severity: 'critical' | 'advisory';
    type: string;
    description: string;
    affectedPatterns: number[];
  }[];
}

export interface PatternInput {
  id: number;
  name: string;
  number: string;
  scale: Scale;
  category: string;
  categoryLabel: string;
  confidence: number;
  status: string;
  problem: string;
  body: string;
  solution: string;
  connections_up: number[];
  connections_down: number[];
  tags?: string[];
}

export interface CheckerOptions {
  summary?: boolean;
  focus?: number[];
  compare?: string;
  output?: 'terminal' | 'json';
  plan?: string;
  suggest?: boolean;
}
