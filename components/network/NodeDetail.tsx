'use client';

import Link from 'next/link';
import type { NetworkNode } from '@/lib/network';
import { getConfidenceStars } from '@/lib/patterns';
import { ScaleBadge } from '@/components/patterns/ScaleBadge';
import { Confidence } from '@/lib/types';

interface NodeDetailProps {
  node: NetworkNode | null;
  onClose: () => void;
}

export function NodeDetail({ node, onClose }: NodeDetailProps) {
  if (!node) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white border border-slate/10 rounded-card p-4 shadow-lg z-10">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-silver hover:text-slate transition-colors"
        aria-label="Close details"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <span className="pattern-number text-lg">{node.number}</span>
        <span className="text-copper">{getConfidenceStars(node.confidence as Confidence)}</span>
      </div>

      <h3 className="font-bold text-charcoal text-lg mb-2">{node.name}</h3>

      <div className="flex items-center gap-2 mb-4">
        <ScaleBadge scale={node.scale} />
        <span className="text-xs text-steel">{node.categoryLabel}</span>
      </div>

      <Link
        href={`/patterns/${node.id}`}
        className="btn btn-primary w-full text-sm"
      >
        View Full Pattern
      </Link>
    </div>
  );
}
