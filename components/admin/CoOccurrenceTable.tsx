'use client';

import { useState } from 'react';
import { getPatternById } from '@/lib/patterns';

interface CoOccurrence {
  pattern1: number;
  pattern2: number;
  count: number;
  isConnectedInNetwork: boolean;
}

interface Props {
  coOccurrences: CoOccurrence[];
}

export function CoOccurrenceTable({ coOccurrences }: Props) {
  const [showUnconnectedOnly, setShowUnconnectedOnly] = useState(false);

  const filtered = showUnconnectedOnly
    ? coOccurrences.filter(c => !c.isConnectedInNetwork)
    : coOccurrences;

  const unconnectedCount = coOccurrences.filter(c => !c.isConnectedInNetwork).length;

  if (coOccurrences.length === 0) {
    return (
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Pattern Co-Occurrence</h2>
        <p className="text-slate text-sm">No co-occurrence data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Pattern Co-Occurrence</h2>
          <p className="text-xs text-slate mt-1">
            Patterns frequently mentioned together in conversations
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
          <input
            type="checkbox"
            checked={showUnconnectedOnly}
            onChange={(e) => setShowUnconnectedOnly(e.target.checked)}
            className="rounded border-slate/30"
          />
          Show unconnected only ({unconnectedCount})
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Pattern 1
              </th>
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Pattern 2
              </th>
              <th className="text-center py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Connected
              </th>
              <th className="text-right py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((co, i) => {
              const p1 = getPatternById(co.pattern1);
              const p2 = getPatternById(co.pattern2);

              return (
                <tr
                  key={i}
                  className={`border-b border-slate/5 hover:bg-slate/5 ${
                    !co.isConnectedInNetwork ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="py-3 pr-4">
                    <span className="font-mono text-copper mr-2">
                      {p1?.reading_order || co.pattern1}
                    </span>
                    <span className="text-charcoal">{p1?.name || 'Unknown'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-copper mr-2">
                      {p2?.reading_order || co.pattern2}
                    </span>
                    <span className="text-charcoal">{p2?.name || 'Unknown'}</span>
                  </td>
                  <td className="py-3 text-center">
                    {co.isConnectedInNetwork ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-amber-600 font-medium">No</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-charcoal">
                    {co.count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 30 && (
        <p className="text-xs text-slate mt-4">
          Showing top 30 of {filtered.length} co-occurrences
        </p>
      )}
    </div>
  );
}
