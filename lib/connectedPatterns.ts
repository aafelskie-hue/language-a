import { patterns, getPatternById } from './patterns';
import type { Pattern } from './types';

/**
 * Returns unselected patterns connected to 2+ selected patterns.
 * Reusable by constellation view (Session 3).
 */
export function getConnectedUnselected(selectedPatternIds: number[]): Array<{
  pattern: Pattern;
  connectedTo: Pattern[];
  connectionCount: number;
}> {
  const selectedSet = new Set(selectedPatternIds);
  const results: Array<{
    pattern: Pattern;
    connectedTo: Pattern[];
    connectionCount: number;
  }> = [];

  for (const candidate of patterns) {
    if (selectedSet.has(candidate.id)) continue;

    const connectedTo: Pattern[] = [];
    const allConnections = [...candidate.connections_up, ...candidate.connections_down];

    for (const connId of allConnections) {
      if (selectedSet.has(connId)) {
        const p = getPatternById(connId);
        if (p) connectedTo.push(p);
      }
    }

    if (connectedTo.length >= 2) {
      results.push({
        pattern: candidate,
        connectedTo,
        connectionCount: connectedTo.length,
      });
    }
  }

  results.sort((a, b) => b.connectionCount - a.connectionCount);
  return results;
}
