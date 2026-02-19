'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';
import { ScaleBadge } from './ScaleBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

interface PatternCardProps {
  pattern: Pattern;
}

export function PatternCard({ pattern }: PatternCardProps) {
  // Truncate problem to ~100 chars
  const truncatedProblem = pattern.problem.length > 120
    ? pattern.problem.slice(0, 120).trim() + '...'
    : pattern.problem;

  return (
    <Link
      href={`/patterns/${pattern.reading_order}`}
      className="card card-hover group block"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="pattern-number text-lg">{pattern.reading_order}</span>
        <ConfidenceBadge confidence={pattern.confidence} />
      </div>

      <h3 className="pattern-name text-lg mb-2 group-hover:text-copper transition-colors">
        {pattern.name}
      </h3>

      <p className="text-sm text-slate leading-relaxed mb-4">
        {truncatedProblem}
      </p>

      <div className="flex items-center gap-2">
        <ScaleBadge scale={pattern.scale} />
      </div>
    </Link>
  );
}
