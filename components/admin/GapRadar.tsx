'use client';

interface GapTopic {
  topic: string;
  phrase: string;
  count: number;
  sampleConversationIds: string[];
}

interface Props {
  gaps: GapTopic[];
}

export function GapRadar({ gaps }: Props) {
  if (gaps.length === 0) {
    return (
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Gap Signals</h2>
        <p className="text-slate text-sm">No gap signals detected yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Gap Signals</h2>
      <p className="text-xs text-slate mb-4">
        Topics where the Guide indicates Language A doesn&apos;t have direct coverage
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Phrase
              </th>
              <th className="text-left py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Topic Context
              </th>
              <th className="text-right py-2 font-mono text-xs uppercase tracking-wider text-steel">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {gaps.slice(0, 20).map((gap, i) => (
              <tr key={i} className="border-b border-slate/5 hover:bg-slate/5">
                <td className="py-3 pr-4">
                  <span className="text-charcoal font-medium">{gap.phrase}</span>
                </td>
                <td className="py-3 pr-4 text-slate max-w-xs truncate">
                  {gap.topic && gap.topic !== gap.phrase ? gap.topic : '-'}
                </td>
                <td className="py-3 text-right font-mono text-charcoal">
                  {gap.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gaps.length > 20 && (
        <p className="text-xs text-slate mt-4">
          Showing top 20 of {gaps.length} gap signals
        </p>
      )}
    </div>
  );
}
