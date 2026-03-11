import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Workshop',
  description:
    'The Workshop gives you focused design sessions with the AI Pattern Guide. Bring a project, apply patterns, build something real.',
  openGraph: {
    title: 'The Workshop — Language A',
    description:
      'The Workshop gives you focused design sessions with the AI Pattern Guide. Bring a project, apply patterns, build something real.',
  },
};

export default function WorkshopPage() {
  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            The Workshop
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-4">
            Bring a project. Build something real.
          </h1>
          <p className="text-xl text-slate font-serif italic mb-12">
            This isn&apos;t a reading tool. It&apos;s a workbench.
          </p>

          <div className="text-left bg-white rounded-xl border border-slate/10 p-8 mb-10">
            <p className="text-slate leading-relaxed mb-6">
              The Workshop gives you five design sessions a month with the AI
              Pattern Guide. Each conversation starts with your project — your
              site, your climate, your constraints — and applies patterns to the
              specific decisions you&apos;re facing.
            </p>

            <h2 className="text-lg font-bold text-charcoal mb-4">
              What you get:
            </h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-copper flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate">
                  Five AI Pattern Guide design sessions per month
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-copper flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate">
                  Project context that persists across sessions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-copper flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate">
                  A Guide that asks what you&apos;re building before it
                  recommends anything
                </span>
              </li>
            </ul>

            <div className="text-center border-t border-slate/10 pt-8">
              <p className="text-lg font-bold text-charcoal mb-3">
                Coming soon.
              </p>
              <p className="text-slate text-sm mb-6">
                The Workshop is in development. In the meantime, all 254
                patterns and the{' '}
                <Link href="/guide" className="text-copper hover:underline">
                  AI Pattern Guide
                </Link>{' '}
                are free to explore.
              </p>
              <p className="text-slate text-sm">
                Want to know when The Workshop opens? Drop a note to{' '}
                <span className="text-charcoal">hello@language-a.com</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
