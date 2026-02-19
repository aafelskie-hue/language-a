'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';

interface ConnectionChipProps {
  pattern: Pattern;
  direction: 'up' | 'down';
}

export function ConnectionChip({ pattern, direction }: ConnectionChipProps) {
  const arrow = direction === 'up' ? '↑' : '↓';

  return (
    <Link
      href={`/patterns/${pattern.reading_order}`}
      className="connection-chip"
    >
      <span aria-hidden="true">{arrow}</span>
      <span className="chip-num">{pattern.reading_order}</span>
      <span className="truncate max-w-[150px]">{pattern.name}</span>
    </Link>
  );
}
