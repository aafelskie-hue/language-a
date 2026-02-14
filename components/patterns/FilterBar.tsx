'use client';

import { Scale, Confidence } from '@/lib/types';
import { categories } from '@/lib/patterns';

interface FilterBarProps {
  scale: Scale | null;
  category: string | null;
  confidence: Confidence | null;
  search: string;
  onScaleChange: (scale: Scale | null) => void;
  onCategoryChange: (category: string | null) => void;
  onConfidenceChange: (confidence: Confidence | null) => void;
  onSearchChange: (search: string) => void;
  onClear: () => void;
}

export function FilterBar({
  scale,
  category,
  confidence,
  search,
  onScaleChange,
  onCategoryChange,
  onConfidenceChange,
  onSearchChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = scale !== null || category !== null || confidence !== null || search !== '';

  const scales: { value: Scale; label: string }[] = [
    { value: 'neighborhood', label: 'Neighborhood' },
    { value: 'building', label: 'Building' },
    { value: 'construction', label: 'Construction' },
  ];

  const confidences: { value: Confidence; label: string }[] = [
    { value: 2, label: '★★ High' },
    { value: 1, label: '★ Moderate' },
    { value: 0, label: '☆ Speculative' },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search patterns..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10"
          aria-label="Search patterns"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Scale Toggles */}
      <div className="flex flex-wrap gap-2">
        {scales.map((s) => (
          <button
            key={s.value}
            onClick={() => onScaleChange(scale === s.value ? null : s.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
              scale === s.value
                ? 'bg-copper text-white border-copper'
                : 'bg-white text-slate border-slate/20 hover:border-copper/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category Select */}
      <select
        value={category || ''}
        onChange={(e) => onCategoryChange(e.target.value || null)}
        className="w-full"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.number}. {cat.label}
          </option>
        ))}
      </select>

      {/* Confidence Select */}
      <select
        value={confidence !== null ? confidence.toString() : ''}
        onChange={(e) => onConfidenceChange(e.target.value ? parseInt(e.target.value) as Confidence : null)}
        className="w-full"
        aria-label="Filter by confidence"
      >
        <option value="">All Confidence Levels</option>
        {confidences.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm text-copper hover:text-copper-dark transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
