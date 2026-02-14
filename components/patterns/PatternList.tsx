'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';
import { ScaleBadge } from './ScaleBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { getScaleLabel } from '@/lib/patterns';

interface PatternListProps {
  patterns: Pattern[];
}

export function PatternList({ patterns }: PatternListProps) {
  return (
    <div className="bg-white border border-slate/10 rounded-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate/10 bg-cloud/50">
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-steel px-4 py-3">
              #
            </th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-steel px-4 py-3">
              Name
            </th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-steel px-4 py-3 hidden md:table-cell">
              Scale
            </th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-steel px-4 py-3 hidden lg:table-cell">
              Category
            </th>
            <th className="text-center font-mono text-[10px] uppercase tracking-widest text-steel px-4 py-3">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((pattern) => (
            <tr
              key={pattern.id}
              className="border-b border-slate/5 hover:bg-copper/5 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="pattern-number">{pattern.number}</span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/patterns/${pattern.id}`}
                  className="font-medium text-charcoal hover:text-copper transition-colors"
                >
                  {pattern.name}
                </Link>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <ScaleBadge scale={pattern.scale} />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm text-slate">{pattern.categoryLabel}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <ConfidenceBadge confidence={pattern.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
