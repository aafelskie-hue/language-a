'use client';

import { useState } from 'react';
import { getPatternById } from '@/lib/patterns';

interface Translation {
  userQuery: string;
  patterns: number[];
  count: number;
}

interface Props {
  translations: Translation[];
}

export function TranslationDictionary({ translations }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? translations.filter(t =>
        t.userQuery.toLowerCase().includes(search.toLowerCase())
      )
    : translations;

  if (translations.length === 0) {
    return (
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Translation Dictionary</h2>
        <p className="text-slate text-sm">No translation data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Translation Dictionary</h2>
          <p className="text-xs text-slate mt-1">
            User queries mapped to patterns referenced in responses
          </p>
        </div>

        <input
          type="text"
          placeholder="Search queries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate/20 rounded-lg w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                User Query
              </th>
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Patterns Referenced
              </th>
              <th className="text-right py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((t, i) => (
              <tr key={i} className="border-b border-slate/5 hover:bg-slate/5">
                <td className="py-3 pr-4 max-w-md">
                  <span className="text-charcoal line-clamp-2">{t.userQuery}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {t.patterns.slice(0, 5).map((patternId) => {
                      const pattern = getPatternById(patternId);
                      return (
                        <span
                          key={patternId}
                          className="inline-block px-2 py-0.5 text-xs font-mono bg-copper/10 text-copper rounded"
                          title={pattern?.name || `Pattern ${patternId}`}
                        >
                          {pattern?.reading_order || patternId}
                        </span>
                      );
                    })}
                    {t.patterns.length > 5 && (
                      <span className="text-xs text-slate">
                        +{t.patterns.length - 5} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-right font-mono text-charcoal">
                  {t.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 50 && (
        <p className="text-xs text-slate mt-4">
          Showing top 50 of {filtered.length} translations
        </p>
      )}
    </div>
  );
}
