/**
 * Output Formatting for Reading Order Assignment
 */

import { Scale } from '../network-checker/types';
import { PatternWithOrder, ValidationResult } from './validator';
import { ScoredPattern } from './scorer';

/**
 * Generate the reading order manifest
 */
export function generateManifest(patterns: PatternWithOrder[]): string {
  const sorted = [...patterns].sort(
    (a, b) => a.reading_order - b.reading_order
  );

  const byScale: Record<Scale, PatternWithOrder[]> = {
    neighborhood: [],
    building: [],
    construction: [],
  };

  for (const p of sorted) {
    byScale[p.scale].push(p);
  }

  const neighborhoodEnd = byScale.neighborhood.length;
  const buildingEnd = neighborhoodEnd + byScale.building.length;
  const constructionEnd = buildingEnd + byScale.construction.length;

  const lines: string[] = [
    '# Language A Reading Order Manifest',
    `# Generated: ${new Date().toISOString()}`,
    `# Total patterns: ${patterns.length}`,
    '',
    `NEIGHBORHOOD SCALE (1-${neighborhoodEnd})`,
  ];

  for (const p of byScale.neighborhood) {
    const idStr = p.id.toString().padStart(3, '0');
    lines.push(
      `  ${p.reading_order.toString().padStart(3)}. [ID ${idStr}] ${p.name}`
    );
  }

  lines.push('');
  lines.push(`BUILDING SCALE (${neighborhoodEnd + 1}-${buildingEnd})`);

  for (const p of byScale.building) {
    const idStr = p.id.toString().padStart(3, '0');
    lines.push(
      `  ${p.reading_order.toString().padStart(3)}. [ID ${idStr}] ${p.name}`
    );
  }

  lines.push('');
  lines.push(`CONSTRUCTION SCALE (${buildingEnd + 1}-${constructionEnd})`);

  for (const p of byScale.construction) {
    const idStr = p.id.toString().padStart(3, '0');
    lines.push(
      `  ${p.reading_order.toString().padStart(3)}. [ID ${idStr}] ${p.name}`
    );
  }

  return lines.join('\n');
}

/**
 * Generate the validation report
 */
export function generateValidationReport(
  validation: ValidationResult,
  scoredPatterns: {
    neighborhood: ScoredPattern[];
    building: ScoredPattern[];
    construction: ScoredPattern[];
  }
): string {
  const lines: string[] = [
    '# Language A Reading Order Validation Report',
    `# Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `Overall valid: ${validation.valid ? 'YES' : 'NO'}`,
    '',
    '## Pattern Counts by Scale',
    `- Neighborhood: ${scoredPatterns.neighborhood.length} patterns (orders ${validation.scaleOrdering.neighborhoodRange[0]}-${validation.scaleOrdering.neighborhoodRange[1]})`,
    `- Building: ${scoredPatterns.building.length} patterns (orders ${validation.scaleOrdering.buildingRange[0]}-${validation.scaleOrdering.buildingRange[1]})`,
    `- Construction: ${scoredPatterns.construction.length} patterns (orders ${validation.scaleOrdering.constructionRange[0]}-${validation.scaleOrdering.constructionRange[1]})`,
    '',
    '## Completeness Check',
    `- Expected: ${validation.completeness.expectedCount} orders`,
    `- Actual unique: ${validation.completeness.actualCount} orders`,
    `- Gaps: ${validation.completeness.gaps.length === 0 ? 'None' : validation.completeness.gaps.join(', ')}`,
    `- Duplicates: ${validation.completeness.duplicates.length === 0 ? 'None' : validation.completeness.duplicates.join(', ')}`,
    '',
    '## Scale Ordering',
    `Valid: ${validation.scaleOrdering.valid ? 'YES' : 'NO'}`,
  ];

  if (validation.scaleOrdering.violations.length > 0) {
    lines.push('Violations:');
    for (const v of validation.scaleOrdering.violations) {
      lines.push(`  - ${v}`);
    }
  }

  lines.push('');
  lines.push('## Forward Reference Ratio');
  lines.push(
    `- Total connections_up references: ${validation.forwardReferenceRatio.total}`
  );
  lines.push(
    `- References pointing to earlier reading_order: ${validation.forwardReferenceRatio.satisfied}`
  );
  lines.push(
    `- Ratio: ${(validation.forwardReferenceRatio.ratio * 100).toFixed(1)}%`
  );
  lines.push(`- Target: ${validation.forwardReferenceRatio.target * 100}%`);
  lines.push(
    `- Met: ${validation.forwardReferenceRatio.met ? 'YES' : 'NO'}`
  );

  lines.push('');
  lines.push('## Cross-Scale Direction');
  lines.push(
    `- Correct cross-scale references: ${validation.crossScaleDirection.correct}`
  );
  lines.push(
    `- Violations: ${validation.crossScaleDirection.violations.length}`
  );

  if (
    validation.crossScaleDirection.violations.length > 0 &&
    validation.crossScaleDirection.violations.length <= 10
  ) {
    for (const v of validation.crossScaleDirection.violations) {
      lines.push(`  - Pattern ${v.patternId} -> ${v.refId}: ${v.direction}`);
    }
  } else if (validation.crossScaleDirection.violations.length > 10) {
    lines.push(
      `  (showing first 10 of ${validation.crossScaleDirection.violations.length})`
    );
    for (const v of validation.crossScaleDirection.violations.slice(0, 10)) {
      lines.push(`  - Pattern ${v.patternId} -> ${v.refId}: ${v.direction}`);
    }
  }

  lines.push('');
  lines.push('## Boundary Assessment');
  lines.push('');
  lines.push('### Neighborhood -> Building Transition');
  lines.push(
    `- Last 3 neighborhood patterns: ${validation.boundaryAssessment.neighborhoodToBuilding.lastNeighborhood.join(', ')}`
  );
  lines.push(
    `- First 3 building patterns: ${validation.boundaryAssessment.neighborhoodToBuilding.firstBuilding.join(', ')}`
  );
  lines.push(
    `- Direct connections: ${validation.boundaryAssessment.neighborhoodToBuilding.connections}`
  );

  lines.push('');
  lines.push('### Building -> Construction Transition');
  lines.push(
    `- Last 3 building patterns: ${validation.boundaryAssessment.buildingToConstruction.lastBuilding.join(', ')}`
  );
  lines.push(
    `- First 3 construction patterns: ${validation.boundaryAssessment.buildingToConstruction.firstConstruction.join(', ')}`
  );
  lines.push(
    `- Direct connections: ${validation.boundaryAssessment.buildingToConstruction.connections}`
  );

  lines.push('');
  lines.push('## Decision Log');
  lines.push('- Sorting algorithm: context_score descending with cluster affinity');
  lines.push('- Context score = (up references) - (down references) within same scale');
  lines.push('- Cluster affinity: swapped adjacent patterns if same category and score difference <= 2');
  lines.push('- Scale order: all neighborhood, then all building, then all construction');

  return lines.join('\n');
}
