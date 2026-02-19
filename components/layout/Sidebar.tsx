'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categories, patterns as allPatterns, getPatternsByCategory } from '@/lib/patterns';
import { useState } from 'react';

interface SidebarProps {
  showPatterns?: boolean;
  currentPatternId?: number;
}

// Group categories by scale
const neighborhoodCategories = categories.filter(c =>
  c.scale.includes('Neighborhood') && !c.scale.includes('Building')
);
const buildingCategories = categories.filter(c =>
  c.scale.includes('Building') || c.scale.includes('Site')
);
const constructionCategories = categories.filter(c =>
  c.scale === 'Construction'
);
const allScaleCategories = categories.filter(c =>
  c.scale === 'All Scales'
);

export function Sidebar({ showPatterns = true, currentPatternId }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    currentPatternId
      ? allPatterns.find(p => p.id === currentPatternId)?.category || null
      : null
  );

  const renderCategoryGroup = (title: string, cats: typeof categories) => {
    if (cats.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <div className="sidebar-section">{title}</div>
        {cats.map((cat) => {
          const isExpanded = expandedCategory === cat.id;
          const categoryPatterns = showPatterns ? getPatternsByCategory(cat.id) : [];

          return (
            <div key={cat.id}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className={`w-full text-left sidebar-item ${isExpanded ? 'font-medium text-copper-dark' : ''}`}
              >
                <span className="num font-mono text-xs">{cat.number}</span>
                <span className="flex-1 truncate">{cat.label.replace('Patterns for ', '').replace('Patterns for the ', '')}</span>
                {showPatterns && (
                  <svg
                    className={`w-4 h-4 text-silver transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {showPatterns && isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {categoryPatterns.map((pattern) => (
                    <Link
                      key={pattern.id}
                      href={`/patterns/${pattern.reading_order}`}
                      className={`sidebar-item text-sm ${
                        currentPatternId === pattern.id ? 'active' : ''
                      }`}
                    >
                      <span className="num">{pattern.reading_order}</span>
                      <span className="truncate">{pattern.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0" aria-label="Pattern categories">
      <div className="sticky top-20 space-y-2 pr-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {renderCategoryGroup('Neighborhood', neighborhoodCategories)}
        {renderCategoryGroup('Building', buildingCategories)}
        {renderCategoryGroup('Construction', constructionCategories)}
        {renderCategoryGroup('All Scales', allScaleCategories)}
      </div>
    </aside>
  );
}
