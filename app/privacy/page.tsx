import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Language A',
};

export default function PrivacyPage() {
  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-steel mb-12">
            Last updated: February 2026
          </p>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate leading-relaxed mb-8">
              We collect the minimum needed to make the site work.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              What we collect
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              If you create a free profile, we store your email address, a hashed password (if you use email/password auth), and your account creation date. If you sign in with Google, we store your email and display name as provided by Google OAuth — we never see your Google password.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              We store the projects and Guide conversations you create while signed in. This is the whole point of a profile — your work persists across sessions.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              We use a session cookie to keep you signed in. It expires when you sign out or after a reasonable inactivity period.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              What we don&apos;t collect
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              We don&apos;t run analytics or tracking scripts beyond what Vercel provides for basic hosting infrastructure (aggregate request counts, error monitoring). We don&apos;t use third-party advertising. We don&apos;t sell your data.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              How we use it
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              Your email is used for password reset only — we don&apos;t send marketing email. Your projects and conversations are used to provide the service you asked for. Nothing else.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Data retention and deletion
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              You can delete your account from the Profile page at any time. Deletion removes your account, projects, and conversation history permanently.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Google OAuth
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              We use Google OAuth as an alternative sign-in method. Google&apos;s own privacy policy governs what Google does with your data. We receive only your email and display name.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Third parties
            </h2>
            <p className="text-slate leading-relaxed mb-8">
              We host on Vercel (Vercel Inc., USA). The AI Guide uses Anthropic&apos;s Claude API — conversations are sent to Anthropic&apos;s API to generate responses. We use Neon (database) and Upstash (rate limiting). These services process data as part of providing the site.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Contact
            </h2>
            <p className="text-slate leading-relaxed mb-12">
              Questions or deletion requests:{' '}
              <a href="mailto:hello@language-a.com" className="text-copper hover:underline">
                hello@language-a.com
              </a>
              .
            </p>

            <div className="pt-8 border-t border-slate/10">
              <Link href="/terms" className="text-copper hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
