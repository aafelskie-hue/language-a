'use client';

import type { Project } from '@/lib/types';

interface ProjectListProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, activeProjectId, onSelect, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate mb-2">No projects yet.</p>
        <p className="text-sm text-steel">Create your first project to start collecting patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId;
        const patternCount = project.patterns.length;
        const appliedCount = project.patterns.filter(p => p.status === 'applied').length;

        return (
          <div
            key={project.id}
            className={`card cursor-pointer transition-all ${
              isActive ? 'border-copper ring-2 ring-copper/20' : 'card-hover'
            }`}
            onClick={() => onSelect(project.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-charcoal">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-slate mt-1">{project.description}</p>
                )}
                <p className="font-mono text-xs text-steel mt-2">
                  {patternCount} pattern{patternCount !== 1 ? 's' : ''}
                  {appliedCount > 0 && ` · ${appliedCount} applied`}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this project?')) {
                    onDelete(project.id);
                  }
                }}
                className="p-1 text-silver hover:text-error transition-colors"
                aria-label="Delete project"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
