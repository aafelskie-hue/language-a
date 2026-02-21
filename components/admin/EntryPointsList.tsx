'use client';

interface EntryPoint {
  readingOrder: number;
  patternId: number;
  patternName: string;
  count: number;
  percentage: number;
}

interface Props {
  entryPoints: EntryPoint[];
}

export function EntryPointsList({ entryPoints }: Props) {
  if (entryPoints.length === 0) {
    return (
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Entry Points</h2>
        <p className="text-slate text-sm">No entry point data yet.</p>
      </div>
    );
  }

  const maxCount = entryPoints[0]?.count || 1;

  return (
    <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Entry Points</h2>
      <p className="text-xs text-slate mb-4">
        First pattern referenced in each conversation
      </p>

      <div className="space-y-3">
        {entryPoints.slice(0, 15).map((entry) => (
          <div key={entry.patternId} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>
                <span className="font-mono text-copper mr-2">{entry.readingOrder}</span>
                <span className="text-charcoal">{entry.patternName}</span>
              </span>
              <span className="font-mono text-steel">
                {entry.count} ({entry.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-slate/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-copper transition-all"
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {entryPoints.length > 15 && (
        <p className="text-xs text-slate mt-4">
          Showing top 15 of {entryPoints.length} entry patterns
        </p>
      )}
    </div>
  );
}
