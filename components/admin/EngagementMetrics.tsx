'use client';

interface Engagement {
  totalConversations: number;
  avgPatternsPerConversation: number;
  totalGapsDetected: number;
  totalEntryPoints: number;
}

interface Props {
  engagement: Engagement;
}

export function EngagementMetrics({ engagement }: Props) {
  return (
    <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Engagement Overview</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
            Total Conversations
          </dt>
          <dd className="text-2xl font-bold text-charcoal">
            {engagement.totalConversations}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
            Avg Patterns/Conversation
          </dt>
          <dd className="text-2xl font-bold text-charcoal">
            {engagement.avgPatternsPerConversation.toFixed(1)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
            Unique Gap Signals
          </dt>
          <dd className="text-2xl font-bold text-charcoal">
            {engagement.totalGapsDetected}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
            Unique Entry Patterns
          </dt>
          <dd className="text-2xl font-bold text-charcoal">
            {engagement.totalEntryPoints}
          </dd>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate/10">
        <h3 className="text-sm font-semibold text-charcoal mb-2">Insights</h3>
        <ul className="text-sm text-slate space-y-1">
          {engagement.avgPatternsPerConversation > 3 && (
            <li>Users are exploring multiple patterns per conversation</li>
          )}
          {engagement.avgPatternsPerConversation <= 3 && engagement.avgPatternsPerConversation > 0 && (
            <li>Users typically focus on 1-3 patterns per conversation</li>
          )}
          {engagement.totalGapsDetected > 0 && (
            <li>{engagement.totalGapsDetected} areas identified where Language A coverage could expand</li>
          )}
          {engagement.totalConversations === 0 && (
            <li>No conversations processed yet. Click &quot;Refresh Analytics&quot; to start.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
