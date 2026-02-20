import type { Metadata } from 'next';
import { updates, groupUpdatesByMonth } from '@/data/updates';

export const metadata: Metadata = {
  title: 'Updates',
  description: 'A record of revisions, refinements, and second thoughts on Language A',
};

export default function UpdatesPage() {
  const groupedUpdates = groupUpdatesByMonth(updates);

  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            Updates
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-4">
            Updates
          </h1>
          <p className="text-slate text-lg mb-12">
            A record of revisions, refinements, and second thoughts
          </p>

          {/* Framing Section */}
          <section className="mb-16">
            <h2 className="font-serif italic text-xl text-charcoal mb-4">
              On keeping a living language
            </h2>
            <div className="space-y-4">
              <p className="text-slate leading-relaxed">
                A pattern language isn&apos;t finished when it&apos;s written. It&apos;s finished when it stops being tested — and we have no intention of stopping.
              </p>
              <p className="text-slate leading-relaxed">
                Language A launched with 254 patterns. Each one was argued over, cross-referenced, and held against real places before it was published. But argument and scrutiny are not the same as time. Time is what reveals which patterns hold under pressure and which ones need another pass. This log is where we record that work — not to perform transparency, but because the work deserves a record.
              </p>
              <p className="text-slate leading-relaxed">
                You&apos;ll find revisions here. You&apos;ll find patterns strengthened by field encounters and connections we missed on the first pass. Occasionally you&apos;ll find something we got wrong, and what we did about it. If a pattern is ever retired, that will be here too, with an honest account of why.
              </p>
              <p className="text-slate leading-relaxed">
                We believe the most trustworthy thing a pattern language can do is show its working.
              </p>
            </div>
          </section>

          {/* Entries by Month */}
          {Array.from(groupedUpdates.entries()).map(([monthYear, entries]) => (
            <section key={monthYear} className="mb-12">
              <h3 className="font-mono text-sm uppercase tracking-wider text-steel mb-6">
                {monthYear}
              </h3>
              <div className="space-y-8">
                {entries.map((entry) => (
                  <article key={entry.id}>
                    <h4 className="text-lg font-semibold text-charcoal mb-3">
                      {entry.title}
                    </h4>
                    <div className="space-y-4">
                      {entry.body.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-slate leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
