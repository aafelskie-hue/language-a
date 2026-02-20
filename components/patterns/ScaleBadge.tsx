'use client';

import type { Scale } from '@/lib/types';
import { getScaleLabel } from '@/lib/patterns';

interface ScaleBadgeProps {
  scale: Scale;
  size?: 'sm' | 'md';
}

export function ScaleBadge({ scale, size = 'sm' }: ScaleBadgeProps) {
  const baseClasses = 'inline-flex items-center font-mono uppercase tracking-wider rounded-full';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  const colorClasses: Record<Scale, string> = {
    neighborhood: 'bg-navy/10 text-navy',
    building: 'bg-copper/10 text-copper-dark',
    construction: 'bg-slate/10 text-slate',
  };

  const tooltips: Record<Scale, string> = {
    neighborhood: 'Patterns for streets, blocks, and communities',
    building: 'Patterns for buildings and the spaces within them',
    construction: 'Patterns for materials, details, and craft',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses} ${colorClasses[scale]}`}
      title={tooltips[scale]}
    >
      {getScaleLabel(scale)}
    </span>
  );
}
