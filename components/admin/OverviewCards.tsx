'use client';

interface Props {
  totalConversations: number;
  totalGaps: number;
  totalEntryPatterns: number;
  avgPatterns: number;
}

export function OverviewCards({
  totalConversations,
  totalGaps,
  totalEntryPatterns,
  avgPatterns,
}: Props) {
  const cards = [
    {
      label: 'Total Conversations',
      value: totalConversations,
      description: 'Analyzed Guide conversations',
    },
    {
      label: 'Gap Signals',
      value: totalGaps,
      description: 'Unique gap phrases detected',
    },
    {
      label: 'Entry Patterns',
      value: totalEntryPatterns,
      description: 'Patterns used as entry points',
    },
    {
      label: 'Avg Patterns/Conv',
      value: avgPatterns.toFixed(1),
      description: 'Average patterns per conversation',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-card border border-slate/10 shadow-sm p-5"
        >
          <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
            {card.label}
          </dt>
          <dd className="text-3xl font-bold text-charcoal">{card.value}</dd>
          <p className="text-xs text-slate mt-1">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
