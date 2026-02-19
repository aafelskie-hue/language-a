'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Project, ProjectPatternStatus } from '@/lib/types';
import { getPatternById } from '@/lib/patterns';
import { PatternStatus } from './PatternStatus';
import { SuggestionPanel } from './SuggestionPanel';
import { SaveProjectPrompt } from './SaveProjectPrompt';
import { ScaleBadge } from '@/components/patterns/ScaleBadge';

interface ProjectDetailProps {
  project: Project;
  onUpdateStatus: (patternId: number, status: ProjectPatternStatus) => void;
  onUpdateNotes: (patternId: number, notes: string) => void;
  onRemovePattern: (patternId: number) => void;
  onAddPattern: (patternId: number) => void;
  onExport: () => void;
}

export function ProjectDetail({
  project,
  onUpdateStatus,
  onUpdateNotes,
  onRemovePattern,
  onAddPattern,
  onExport,
}: ProjectDetailProps) {
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);

  const patternIds = project.patterns.map(p => p.patternId);
  const sortedPatterns = [...project.patterns].sort((a, b) => a.patternId - b.patternId);

  const statusCounts = {
    not_started: project.patterns.filter(p => p.status === 'not_started').length,
    considering: project.patterns.filter(p => p.status === 'considering').length,
    applied: project.patterns.filter(p => p.status === 'applied').length,
    rejected: project.patterns.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">{project.name}</h2>
          {project.description && (
            <p className="text-slate mt-1">{project.description}</p>
          )}
        </div>
        <button onClick={onExport} className="btn btn-secondary text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

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

      {/* Pattern List */}
      {sortedPatterns.length === 0 ? (
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
        <div className="space-y-2">
          {sortedPatterns.map((pp) => {
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

                  <span className="font-mono text-copper text-sm">{pattern.number}</span>

                  <Link
                    href={`/patterns/${pattern.id}`}
                    className="flex-1 font-medium text-charcoal hover:text-copper transition-colors"
                  >
                    {pattern.name}
                  </Link>

                  <ScaleBadge scale={pattern.scale} />

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
                      placeholder="Add notes about how this pattern applies to your project..."
                      className="w-full h-24 resize-none"
                    />
                  </div>
                )}
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
