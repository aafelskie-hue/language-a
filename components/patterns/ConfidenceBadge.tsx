'use client';

import type { Confidence } from '@/lib/types';
import { getConfidenceStars, getConfidenceLabel } from '@/lib/patterns';

interface ConfidenceBadgeProps {
  confidence: Confidence;
  showLabel?: boolean;
}

export function ConfidenceBadge({ confidence, showLabel = false }: ConfidenceBadgeProps) {
  const stars = getConfidenceStars(confidence);
  const label = getConfidenceLabel(confidence);

  return (
    <span
      className="inline-flex items-center gap-1 text-copper"
      title={label}
      aria-label={`${label} (${stars})`}
    >
      <span className="font-mono text-sm" aria-hidden="true">{stars}</span>
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
          {label}
        </span>
      )}
    </span>
  );
}
