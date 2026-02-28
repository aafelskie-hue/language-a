'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Project, ProjectPatternStatus, Scale } from '@/lib/types';
import { getPatternById, getScaleLabel } from '@/lib/patterns';
import { PatternStatus } from './PatternStatus';
import { SuggestionPanel } from './SuggestionPanel';
import { SaveProjectPrompt } from './SaveProjectPrompt';
import { ScaleBadge } from '@/components/patterns/ScaleBadge';

interface ProjectDetailProps {
  project: Project;
  onUpdateStatus: (patternId: number, status: ProjectPatternStatus) => void;
  onUpdateNotes: (patternId: number, notes: string) => void;
  onUpdateDescription: (description: string) => void;
  onRemovePattern: (patternId: number) => void;
  onAddPattern: (patternId: number) => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  isPdfExporting: boolean;
}

const SCALE_ORDER: Scale[] = ['neighborhood', 'building', 'construction'];

export function ProjectDetail({
  project,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateDescription,
  onRemovePattern,
  onAddPattern,
  onExportMarkdown,
  onExportPdf,
  isPdfExporting,
}: ProjectDetailProps) {
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);
  const [localDescription, setLocalDescription] = useState(project.description);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click-outside
  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!exportOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExportOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [exportOpen]);

  // Reset local description when project changes
  const [prevProjectId, setPrevProjectId] = useState(project.id);
  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setLocalDescription(project.description);
  }

  const patternIds = project.patterns.map(p => p.patternId);

  // Group patterns by scale
  const scaleGroups = useMemo(() => {
    const groups = new Map<Scale, typeof project.patterns>();

    for (const pp of project.patterns) {
      const pattern = getPatternById(pp.patternId);
      if (!pattern) continue;
      const group = groups.get(pattern.scale) || [];
      group.push(pp);
      groups.set(pattern.scale, group);
    }

    // Sort within each group by reading_order
    Array.from(groups.keys()).forEach((scale) => {
      const group = groups.get(scale)!;
      groups.set(
        scale,
        [...group].sort((a, b) => {
          const pa = getPatternById(a.patternId);
          const pb = getPatternById(b.patternId);
          return (pa?.reading_order ?? 0) - (pb?.reading_order ?? 0);
        })
      );
    });

    return groups;
  }, [project.patterns]);

  const statusCounts = {
    not_started: project.patterns.filter(p => p.status === 'not_started').length,
    considering: project.patterns.filter(p => p.status === 'considering').length,
    applied: project.patterns.filter(p => p.status === 'applied').length,
    rejected: project.patterns.filter(p => p.status === 'rejected').length,
  };

  const handleDescriptionBlur = () => {
    if (localDescription !== project.description) {
      onUpdateDescription(localDescription);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold text-charcoal">{project.name}</h2>
        <div className="relative flex-shrink-0" ref={exportRef}>
          <button
            onClick={() => !isPdfExporting && setExportOpen(!exportOpen)}
            disabled={isPdfExporting}
            className="btn btn-secondary text-sm"
          >
            {isPdfExporting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          {exportOpen && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate/10 py-1 z-50"
              role="menu"
            >
              <button
                role="menuitem"
                onClick={() => { setExportOpen(false); onExportMarkdown(); }}
                className="w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-cloud/50 transition-colors"
              >
                Markdown (.md)
              </button>
              <button
                role="menuitem"
                onClick={() => { setExportOpen(false); onExportPdf(); }}
                className="w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-cloud/50 transition-colors"
              >
                PDF (.pdf)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editable Description */}
      <textarea
        value={localDescription}
        onChange={(e) => setLocalDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Describe your project — site, climate, program, constraints. This helps the Pattern Guide give you better recommendations."
        className="w-full h-24 resize-none text-sm"
      />

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate/5 rounded-lg p-3 text-center">
          <p className="font-mono text-2xl text-slate">{statusCounts.not_started}</p>
          <p className="text-xs text-steel">Not Started</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="font-mono text-2xl text-amber-700">{statusCounts.considering}</p>
          <p className="text-xs text-amber-600">Considering</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="font-mono text-2xl text-green-700">{statusCounts.applied}</p>
          <p className="text-xs text-green-600">Applied</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="font-mono text-2xl text-red-700">{statusCounts.rejected}</p>
          <p className="text-xs text-red-600">Rejected</p>
        </div>
      </div>

      {/* Pattern List — grouped by scale */}
      {project.patterns.length === 0 ? (
        <div className="text-center py-12 bg-cloud/50 rounded-card">
          <p className="text-slate mb-2">No patterns in this project yet.</p>
          <p className="text-sm text-steel">
            Browse patterns and click &quot;Add to Project&quot; to get started.
          </p>
          <Link href="/" className="btn btn-primary mt-4">
            Browse Patterns
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {SCALE_ORDER.map((scale) => {
            const group = scaleGroups.get(scale);
            if (!group || group.length === 0) return null;

            return (
              <div key={scale}>
                <h3 className="font-mono text-xs uppercase tracking-widest text-steel mb-3">
                  {getScaleLabel(scale).toUpperCase()} — {group.length} {group.length === 1 ? 'pattern' : 'patterns'}
                </h3>
                <div className="space-y-2">
                  {group.map((pp) => {
                    const pattern = getPatternById(pp.patternId);
                    if (!pattern) return null;

                    const isExpanded = expandedPattern === pp.patternId;

                    return (
                      <div key={pp.patternId} className="card">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setExpandedPattern(isExpanded ? null : pp.patternId)}
                            className="p-1 text-silver hover:text-slate transition-colors"
                            aria-expanded={isExpanded}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          <span className="font-mono text-copper text-sm">{pattern.reading_order}</span>

                          <Link
                            href={`/patterns/${pattern.reading_order}`}
                            className="flex-1 font-medium text-charcoal hover:text-copper transition-colors"
                          >
                            {pattern.name}
                          </Link>

                          <PatternStatus
                            status={pp.status}
                            onChange={(status) => onUpdateStatus(pp.patternId, status)}
                          />

                          <button
                            onClick={() => onRemovePattern(pp.patternId)}
                            className="p-1 text-silver hover:text-error transition-colors"
                            aria-label="Remove pattern"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate/10">
                            <label className="block text-sm font-medium text-slate mb-2">
                              Notes
                            </label>
                            <textarea
                              value={pp.notes}
                              onChange={(e) => onUpdateNotes(pp.patternId, e.target.value)}
                              placeholder="How does this pattern show up in your project?"
                              className="w-full h-24 resize-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Project Prompt for anonymous users */}
      <SaveProjectPrompt patternCount={project.patterns.length} />

      {/* Suggestions */}
      {patternIds.length > 0 && (
        <SuggestionPanel patternIds={patternIds} onAddPattern={onAddPattern} />
      )}
    </div>
  );
}
