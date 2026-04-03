'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatInterface } from '@/components/guide/ChatInterface';
import { UsageIndicator } from '@/components/guide/UsageIndicator';

export default function GuidePage() {
  const [tierExpanded, setTierExpanded] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-3">
          AI Pattern Guide
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
          Pattern Guide
        </h1>
        <p className="text-slate max-w-2xl">
          Your design partner for the pattern language. Describe what you&apos;re working on,
          explore any pattern, or bring a design challenge — the Guide works from the full
          text of every pattern it recommends and tells you where the language has gaps.
        </p>
        <button
          onClick={() => setTierExpanded(!tierExpanded)}
          className="mt-3 text-sm text-steel hover:text-copper transition-colors"
        >
          {tierExpanded ? 'Hide details' : 'What\u2019s free vs. The Workshop'}
        </button>
        {tierExpanded && (
          <div className="mt-4 max-w-2xl space-y-4 text-sm text-slate border-t border-slate/10 pt-4">
            <div>
              <h3 className="font-semibold text-charcoal mb-1">What&apos;s Free</h3>
              <p>
                Everything that teaches. All 254 patterns — full text, evidence, solutions,
                network connections. The pattern explorer. The network visualization. The project
                builder. Search, filter, browse. The entire intellectual contribution is free,
                ungated, and complete.
              </p>
              <p className="mt-2">
                The AI Pattern Guide is free for 5 conversations per month. Enough to describe a
                project, explore pattern connections, and see what the Guide can do with your
                specific situation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal mb-1">What&apos;s in The Workshop</h3>
              <p>
                The Workshop is where the Guide becomes a sustained design partner. Unlimited
                conversations. Project context that persists across sessions. The same design
                intelligence, without a monthly conversation limit.
              </p>
              <p className="mt-2">
                The Workshop is in development. When it opens, pricing will be straightforward:
                $9/month or $79/year. In the meantime, the free tier gives you everything you need
                to start working with the language.{' '}
                <Link href="/workshop" className="text-copper hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Usage indicator */}
      <UsageIndicator />

      {/* Chat Interface */}
      <div className="card p-0 overflow-hidden">
        <ChatInterface />
      </div>

    </div>
  );
}
