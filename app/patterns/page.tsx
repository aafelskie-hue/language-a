'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { patterns, filterPatterns, getRandomPattern, categories } from '@/lib/patterns';
import type { Scale, Confidence } from '@/lib/types';
import { PatternCard } from '@/components/patterns/PatternCard';
import { PatternList } from '@/components/patterns/PatternList';
import { FilterBar } from '@/components/patterns/FilterBar';

type ViewMode = 'grid' | 'list';

export default function PatternsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [scale, setScale] = useState<Scale | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [search, setSearch] = useState('');

  const filteredPatterns = useMemo(() => {
    return filterPatterns({ scale, category, confidence, search });
  }, [scale, category, confidence, search]);

  const handleRandomPattern = () => {
    const randomPattern = getRandomPattern();
    router.push(`/patterns/${randomPattern.id}`);
  };

  const clearFilters = () => {
    setScale(null);
    setCategory(null);
    setConfidence(null);
    setSearch('');
  };

  const hasActiveFilters = scale || category || confidence !== null || search;

  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-2">
            Pattern Explorer
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-4">
            All {patterns.length} Patterns
          </h1>
          <p className="text-slate max-w-2xl">
            Browse the complete collection of design patterns for places that last.
            Filter by scale, category, or search for specific topics.
          </p>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 mb-6 lg:mb-0">
            <FilterBar
              scale={scale}
              category={category}
              confidence={confidence}
              search={search}
              onScaleChange={setScale}
              onCategoryChange={setCategory}
              onConfidenceChange={setConfidence}
              onSearchChange={setSearch}
              onClear={clearFilters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-sm text-steel">
                Showing <span className="text-charcoal font-medium">{filteredPatterns.length}</span> of {patterns.length} patterns
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRandomPattern}
                  className="btn btn-secondary text-sm"
                  aria-label="Go to random pattern"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Random
                </button>

                <div className="flex items-center border border-slate/20 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' ? 'bg-copper text-white' : 'bg-white text-slate hover:bg-cloud'
                    }`}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' ? 'bg-copper text-white' : 'bg-white text-slate hover:bg-cloud'
                    }`}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {filteredPatterns.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate mb-4">No patterns match your filters.</p>
                <button onClick={clearFilters} className="btn btn-secondary">
                  Clear filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredPatterns.map((pattern) => (
                  <PatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            ) : (
              <PatternList patterns={filteredPatterns} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
