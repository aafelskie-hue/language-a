'use client';

import type { Scale } from '@/lib/types';

interface NetworkControlsProps {
  colorMode: 'scale' | 'category';
  onColorModeChange: (mode: 'scale' | 'category') => void;
  visibleScales: Scale[];
  onScaleToggle: (scale: Scale) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onReset: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function NetworkControls({
  colorMode,
  onColorModeChange,
  visibleScales,
  onScaleToggle,
  search,
  onSearchChange,
  onReset,
  isExpanded,
  onToggle,
}: NetworkControlsProps) {
  const scales: Scale[] = ['neighborhood', 'building', 'construction'];

  return (
    <div className="absolute top-4 left-4 z-20">
      {/* Toggle button - always visible */}
      <button
        onClick={onToggle}
        className="w-10 h-10 flex items-center justify-center bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate/10 text-charcoal hover:text-copper transition-colors"
        aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
        aria-expanded={isExpanded}
      >
        <FilterIcon />
      </button>

      {/* Panel content - slides/fades in */}
      <div
        className={`
          mt-2 bg-white/95 backdrop-blur rounded-card shadow-lg border border-slate/10 p-4 space-y-4
          transition-all duration-300 ease-in-out origin-top-left
          ${isExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'}
        `}
        style={{ width: '240px' }}
      >
        {/* Search */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            Search
          </label>
          <input
            type="search"
            placeholder="Find pattern..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-sm"
          />
        </div>

        {/* Color Mode */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            Color By
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onColorModeChange('scale')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                colorMode === 'scale'
                  ? 'bg-copper text-white border-copper'
                  : 'bg-white text-slate border-slate/20 hover:border-copper/50'
              }`}
            >
              Scale
            </button>
            <button
              onClick={() => onColorModeChange('category')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                colorMode === 'category'
                  ? 'bg-copper text-white border-copper'
                  : 'bg-white text-slate border-slate/20 hover:border-copper/50'
              }`}
            >
              Category
            </button>
          </div>
        </div>

        {/* Scale Visibility */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            Show Scales
          </label>
          <div className="space-y-1">
            {scales.map((scale) => (
              <label key={scale} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleScales.includes(scale)}
                  onChange={() => onScaleToggle(scale)}
                  className="rounded border-slate/30 text-copper focus:ring-copper"
                />
                <span className="text-sm text-slate capitalize">{scale}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
            Legend
          </label>
          {colorMode === 'scale' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-navy"></span>
                <span className="text-xs text-slate">Neighborhood</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-copper"></span>
                <span className="text-xs text-slate">Building</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-steel"></span>
                <span className="text-xs text-slate">Construction</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-steel">Colors represent 19 categories</p>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="w-full btn btn-secondary text-sm"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
