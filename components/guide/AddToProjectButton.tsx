'use client';

import { useProjectStore } from '@/store/useProjectStore';

interface AddToProjectButtonProps {
  patternId: number;
}

export function AddToProjectButton({ patternId }: AddToProjectButtonProps) {
  const { addPattern, isPatternInProject, getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  if (!activeProject) return null;

  const isInProject = isPatternInProject(activeProject.id, patternId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isInProject) {
      addPattern(activeProject.id, patternId);
    }
  };

  if (isInProject) {
    return (
      <span
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-copper/50"
        title="Already in project"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-steel hover:text-copper transition-colors md:opacity-0 md:group-hover:opacity-100"
      title={`Add to ${activeProject.name}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
