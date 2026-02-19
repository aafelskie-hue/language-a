'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';
import { getConfidenceStars } from '@/lib/patterns';

interface PatternCardProps {
  pattern: Pattern;
}

export function InlinPatternCard({ pattern }: PatternCardProps) {
  // Truncate problem to first sentence or 80 chars
  const firstSentence = pattern.problem.split(/[.!?]/)[0];
  const truncatedProblem = firstSentence.length > 80
    ? firstSentence.slice(0, 77) + '...'
    : firstSentence + '.';

  return (
    <Link
      href={`/patterns/${pattern.reading_order}`}
      className="block my-2 p-3 bg-copper-pale/30 border border-copper/20 rounded-lg hover:border-copper/40 hover:bg-copper-pale/50 transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-lg font-medium text-copper flex-shrink-0">
          {pattern.reading_order}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-charcoal group-hover:text-copper transition-colors truncate">
              {pattern.name}
            </h4>
            <span className="text-copper text-sm flex-shrink-0" title={`Confidence: ${getConfidenceStars(pattern.confidence)}`}>
              {getConfidenceStars(pattern.confidence)}
            </span>
          </div>
          <p className="text-sm text-slate line-clamp-2">
            {truncatedProblem}
          </p>
        </div>
        <svg
          className="w-4 h-4 text-copper opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
