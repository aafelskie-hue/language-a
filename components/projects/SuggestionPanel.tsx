'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';
import { getSuggestedPatterns } from '@/lib/patterns';

interface SuggestionPanelProps {
  patternIds: number[];
  onAddPattern: (id: number) => void;
}

export function SuggestionPanel({ patternIds, onAddPattern }: SuggestionPanelProps) {
  const suggestions = getSuggestedPatterns(patternIds).slice(0, 6);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-copper-pale/30 border border-copper/20 rounded-card p-4">
      <h3 className="font-mono text-xs uppercase tracking-widest text-copper mb-3">
        Suggested Patterns
      </h3>
      <p className="text-sm text-slate mb-4">
        Based on the connections in your project, consider adding:
      </p>
      <div className="space-y-2">
        {suggestions.map((pattern) => (
          <div
            key={pattern.id}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate/10"
          >
            <Link
              href={`/patterns/${pattern.reading_order}`}
              className="flex items-center gap-2 text-sm hover:text-copper transition-colors"
            >
              <span className="font-mono text-xs text-copper">{pattern.reading_order}</span>
              <span className="text-charcoal">{pattern.name}</span>
            </Link>
            <button
              onClick={() => onAddPattern(pattern.id)}
              className="text-xs text-copper hover:text-copper-dark transition-colors"
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
