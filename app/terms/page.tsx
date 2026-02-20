import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Language A',
};

export default function TermsPage() {
  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-steel mb-12">
            Last updated: February 2026
          </p>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate leading-relaxed mb-8">
              Language A is a free resource. Using it is straightforward, and so are the rules.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              What you can do
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              You may read, explore, and use the patterns freely — for personal projects, professional work, or any purpose that involves designing and building better places. That&apos;s what this is for.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              You may save projects and guide conversations by creating a free profile. Your data belongs to you. We don&apos;t sell it, share it, or use it for advertising.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              What we ask in return
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Don&apos;t attempt to scrape, copy, or republish the pattern content in bulk. The patterns represent substantial original work. Quoting or referencing individual patterns with attribution is fine — wholesale reproduction is not.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              Don&apos;t use the AI Guide to generate content unrelated to design, architecture, or the built environment. The Guide is purpose-built. Keep it to its purpose.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              The AI Guide
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              The Guide uses Anthropic&apos;s Claude API. Conversations are stored to provide continuity across sessions for authenticated users. We don&apos;t use your conversations to train models. Rate limits apply by tier — anonymous users get 2 conversations, free profiles get 5 per week.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Limitation of liability
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              Language A and its patterns are provided as reference material. We&apos;re structural engineers and designers, not lawyers. Nothing here constitutes professional advice for any specific project. Use your judgment. Hire appropriate professionals.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Changes
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              We&apos;ll update this page if anything substantive changes and note the date at the top.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Questions
            </h2>
            <p className="text-slate leading-relaxed mb-12">
              Contact us at{' '}
              <a href="mailto:hello@language-a.com" className="text-copper hover:underline">
                hello@language-a.com
              </a>
              .
            </p>

            <div className="pt-8 border-t border-slate/10">
              <Link href="/privacy" className="text-copper hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
