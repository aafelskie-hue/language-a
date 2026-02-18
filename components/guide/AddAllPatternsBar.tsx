'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';

interface AddAllPatternsBarProps {
  patternIds: number[];
}

export function AddAllPatternsBar({ patternIds }: AddAllPatternsBarProps) {
  const { addPattern, isPatternInProject, getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();
  const [justAdded, setJustAdded] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  if (!activeProject || patternIds.length === 0) return null;

  const patternsNotInProject = patternIds.filter(
    id => !isPatternInProject(activeProject.id, id)
  );

  // If we just added patterns, show confirmation
  if (justAdded) {
    return (
      <div className="mt-4 pt-3 border-t border-slate/10">
        <span className="text-sm text-copper/50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {addedCount} pattern{addedCount !== 1 ? 's' : ''} added to {activeProject.name}
        </span>
      </div>
    );
  }

  // If all patterns are already in project, show nothing
  if (patternsNotInProject.length === 0) return null;

  const handleAddAll = () => {
    const count = patternsNotInProject.length;
    patternsNotInProject.forEach(patternId => {
      addPattern(activeProject.id, patternId);
    });
    setAddedCount(count);
    setJustAdded(true);
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate/10">
      <button
        onClick={handleAddAll}
        className="text-sm text-steel hover:text-copper transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add all {patternsNotInProject.length} pattern{patternsNotInProject.length !== 1 ? 's' : ''} to {activeProject.name}
      </button>
    </div>
  );
}
