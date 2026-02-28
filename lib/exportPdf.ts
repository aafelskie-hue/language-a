import type { Scale, ProjectPatternStatus } from './types';
import { getPatternById, getScaleLabel, categories } from './patterns';
import { getConnectedUnselected } from './connectedPatterns';

function sanitizeForPdf(text: string): string {
  return text
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3');
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const STATUS_LABELS: Record<ProjectPatternStatus, string> = {
  not_started: 'Not Started',
  considering: 'Considering',
  applied: 'Applied',
  rejected: 'Rejected',
};

const SCALE_ORDER: Scale[] = ['neighborhood', 'building', 'construction'];

export interface PdfPatternEntry {
  readingOrder: number;
  name: string;
  solution: string;
  status: string;
  notes: string;
}

export interface PdfScaleGroup {
  scale: Scale;
  label: string;
  patterns: PdfPatternEntry[];
}

export interface PdfConnectedEntry {
  readingOrder: number;
  name: string;
  solution: string;
  connectedToNames: string[];
}

export interface PdfNetworkSummary {
  patternCount: number;
  categoryCount: number;
  scaleCount: number;
  pairwiseConnections: number;
  avgConnectionsPerPattern: number;
  densityLabel: 'Sparse' | 'Moderate' | 'Dense';
}

export interface PdfExportData {
  projectName: string;
  description: string;
  date: string;
  patternCount: number;
  scaleNames: string[];
  scaleGroups: PdfScaleGroup[];
  connectedPatterns: PdfConnectedEntry[];
  totalConnectedCount: number;
  networkSummary: PdfNetworkSummary;
}

export function computeNetworkSummary(selectedPatternIds: number[]): PdfNetworkSummary {
  const selectedSet = new Set(selectedPatternIds);
  const categorySet = new Set<string>();
  const scaleSet = new Set<Scale>();

  let totalEdgesDoubled = 0;

  for (const id of selectedPatternIds) {
    const pattern = getPatternById(id);
    if (!pattern) continue;

    categorySet.add(pattern.category);
    scaleSet.add(pattern.scale);

    const connections = [...pattern.connections_up, ...pattern.connections_down];
    for (const connId of connections) {
      if (selectedSet.has(connId)) {
        totalEdgesDoubled++;
      }
    }
  }

  const pairwiseConnections = Math.floor(totalEdgesDoubled / 2);
  const patternCount = selectedPatternIds.length;
  const avgConnectionsPerPattern = patternCount > 0 ? pairwiseConnections / patternCount : 0;

  let densityLabel: 'Sparse' | 'Moderate' | 'Dense';
  if (avgConnectionsPerPattern < 2) {
    densityLabel = 'Sparse';
  } else if (avgConnectionsPerPattern <= 4) {
    densityLabel = 'Moderate';
  } else {
    densityLabel = 'Dense';
  }

  return {
    patternCount,
    categoryCount: categorySet.size,
    scaleCount: scaleSet.size,
    pairwiseConnections,
    avgConnectionsPerPattern,
    densityLabel,
  };
}

interface PatternInput {
  patternId: number;
  status: string;
  notes: string;
}

export function buildPdfExportData(
  name: string,
  description: string,
  patterns: PatternInput[]
): PdfExportData {
  const patternIds = patterns.map(p => p.patternId);

  // Group by scale
  const groupMap = new Map<Scale, PdfPatternEntry[]>();

  for (const pp of patterns) {
    const pattern = getPatternById(pp.patternId);
    if (!pattern) continue;

    const entry: PdfPatternEntry = {
      readingOrder: pattern.reading_order,
      name: pattern.name,
      solution: capitalize(sanitizeForPdf(pattern.solution)),
      status: STATUS_LABELS[pp.status as ProjectPatternStatus] ?? pp.status,
      notes: sanitizeForPdf(pp.notes || ''),
    };

    const group = groupMap.get(pattern.scale) || [];
    group.push(entry);
    groupMap.set(pattern.scale, group);
  }

  // Sort within each group by reading_order
  for (const scale of SCALE_ORDER) {
    const group = groupMap.get(scale);
    if (group) group.sort((a: PdfPatternEntry, b: PdfPatternEntry) => a.readingOrder - b.readingOrder);
  }

  const scaleGroups: PdfScaleGroup[] = [];
  const scaleNames: string[] = [];

  for (const scale of SCALE_ORDER) {
    const group = groupMap.get(scale);
    if (!group || group.length === 0) continue;

    scaleGroups.push({
      scale,
      label: getScaleLabel(scale),
      patterns: group,
    });
    scaleNames.push(getScaleLabel(scale));
  }

  // Connected patterns with tiebreaker sort
  const connected = getConnectedUnselected(patternIds);
  connected.sort((a, b) => {
    if (b.connectionCount !== a.connectionCount) {
      return b.connectionCount - a.connectionCount;
    }
    return a.pattern.reading_order - b.pattern.reading_order;
  });

  const totalConnectedCount = connected.length;
  const cappedConnected = connected.slice(0, 8);

  const connectedPatterns: PdfConnectedEntry[] = cappedConnected.map(entry => ({
    readingOrder: entry.pattern.reading_order,
    name: entry.pattern.name,
    solution: capitalize(sanitizeForPdf(entry.pattern.solution)),
    connectedToNames: entry.connectedTo.map(p => p.name),
  }));

  const networkSummary = computeNetworkSummary(patternIds);

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    projectName: name,
    description,
    date,
    patternCount: patternIds.length,
    scaleNames,
    scaleGroups,
    connectedPatterns,
    totalConnectedCount,
    networkSummary,
  };
}
