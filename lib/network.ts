import { patterns, categories } from './patterns';
import type { Pattern, Scale } from './types';

export interface NetworkNode {
  id: number;
  name: string;
  number: string;
  scale: Scale;
  category: string;
  categoryLabel: string;
  confidence: number;
  // D3 will add x, y, vx, vy
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkLink {
  source: number | NetworkNode;
  target: number | NetworkNode;
  direction: 'up' | 'down';
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export function prepareNetworkData(): NetworkData {
  const nodes: NetworkNode[] = patterns.map(p => ({
    id: p.id,
    name: p.name,
    number: p.number,
    scale: p.scale,
    category: p.category,
    categoryLabel: p.categoryLabel,
    confidence: p.confidence,
  }));

  const links: NetworkLink[] = [];

  // Create links from connections_down (parent -> child)
  for (const pattern of patterns) {
    for (const targetId of pattern.connections_down) {
      links.push({
        source: pattern.id,
        target: targetId,
        direction: 'down',
      });
    }
  }

  return { nodes, links };
}

// Colors for scales
export const scaleColors: Record<Scale, string> = {
  neighborhood: '#1E3A5F', // navy
  building: '#B5734A', // copper
  construction: '#6B7280', // steel
};

// Generate colors for categories - harmonious palette
export const categoryColors: Record<string, string> = {
  'fifteen-minute-life': '#1E3A5F',
  'digital-age-dwelling': '#B5734A',
  'housing-diversity': '#8B5A3A',
  'climate-resilience': '#2D5A3A',
  'energy-envelope': '#5A4A2D',
  'food-water': '#2D4A5A',
  'adaptive-reuse': '#5A2D4A',
  'health-biophilia': '#2D5A5A',
  'foundation': '#4A5A2D',
  'community-governance': '#5A3A2D',
  'construction-making': '#4A2D5A',
  'northern-living': '#2D3A5A',
  'water-infrastructure': '#3A5A4A',
  'children-play': '#5A4A3A',
  'aging-accessibility': '#4A3A5A',
  'light-darkness': '#5A5A2D',
  'sound-silence': '#3A4A5A',
  'the-commons': '#5A2D3A',
  'density-done-right': '#3A5A2D',
};

// Node sizes by scale
export const scaleSizes: Record<Scale, number> = {
  neighborhood: 12,
  building: 9,
  construction: 6,
};
