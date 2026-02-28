import type { Project, ProjectPatternStatus } from './types';
import { getPatternById, getScaleLabel } from './patterns';
import { getConnectedUnselected } from './connectedPatterns';
import type { Scale } from './types';

const STATUS_LABELS: Record<ProjectPatternStatus, string> = {
  not_started: 'Not Started',
  considering: 'Considering',
  applied: 'Applied',
  rejected: 'Rejected',
};

const SCALE_ORDER: Scale[] = ['neighborhood', 'building', 'construction'];

export function generateProjectMarkdown(project: Project): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${project.name}`);
  lines.push('');

  // Description
  if (project.description) {
    lines.push(project.description);
    lines.push('');
  }

  // Date
  const created = new Date(project.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  lines.push(`*Created ${created} — exported from Language A*`);
  lines.push('');

  // Patterns grouped by scale
  const patternIds = project.patterns.map(p => p.patternId);
  const patternsByScale = new Map<Scale, typeof project.patterns>();

  for (const pp of project.patterns) {
    const pattern = getPatternById(pp.patternId);
    if (!pattern) continue;
    const group = patternsByScale.get(pattern.scale) || [];
    group.push(pp);
    patternsByScale.set(pattern.scale, group);
  }

  lines.push('---');
  lines.push('');

  for (const scale of SCALE_ORDER) {
    const group = patternsByScale.get(scale);
    if (!group || group.length === 0) continue;

    // Sort by reading_order within group
    const sorted = [...group].sort((a, b) => {
      const pa = getPatternById(a.patternId);
      const pb = getPatternById(b.patternId);
      return (pa?.reading_order ?? 0) - (pb?.reading_order ?? 0);
    });

    lines.push(`## ${getScaleLabel(scale)}`);
    lines.push('');

    for (const pp of sorted) {
      const pattern = getPatternById(pp.patternId);
      if (!pattern) continue;

      lines.push(`### ${pattern.reading_order}. ${pattern.name}`);
      lines.push(`**Status:** ${STATUS_LABELS[pp.status]}`);
      if (pp.notes) {
        lines.push('');
        lines.push(pp.notes);
      }
      lines.push('');
    }
  }

  // Connected patterns appendix
  const connected = getConnectedUnselected(patternIds);
  if (connected.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Connected Patterns');
    lines.push('');
    lines.push('*Patterns not in this project that connect to two or more of your selected patterns.*');
    lines.push('');

    for (const entry of connected) {
      const names = entry.connectedTo.map(p => p.name).join(', ');
      lines.push(
        `- **${entry.pattern.reading_order}. ${entry.pattern.name}** — connects to ${names}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
