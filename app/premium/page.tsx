'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PremiumPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (interval: 'monthly' | 'annual') => {
    if (!session) {
      // Redirect to sign in with callback to premium
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/premium')}`;
      return;
    }

    setLoading(interval);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('monthly');
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            Premium
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-4">
            Language A Premium
          </h1>
          <p className="text-xl text-slate font-serif italic mb-12">
            Your pattern language. Your design collaborator.
          </p>

          <div className="text-left bg-white rounded-xl border border-slate/10 p-8 mb-10">
            <p className="text-slate leading-relaxed mb-6">
              The AI Pattern Guide works with you on your project — your climate, your site, your program, your constraints. It synthesizes patterns you might not have connected, surfaces forces specific to your context, and helps you see what you&apos;re already looking at.
            </p>

            <h2 className="text-lg font-bold text-charcoal mb-4">What you get:</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-copper flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate">Unlimited AI Pattern Guide conversations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-copper flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate">Project context that persists across sessions</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-copper flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate">Full access to all current and future Guide capabilities</span>
              </li>
            </ul>

            <div className="text-center border-t border-slate/10 pt-8">
              <p className="text-2xl font-bold text-charcoal mb-6">
                $9 USD/month · $79 USD/year <span className="text-base font-normal text-slate">(save ~30%)</span>
              </p>

              {error && (
                <p className="text-sm text-red-600 mb-4">{error}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading !== null}
                  className="btn btn-primary px-8"
                >
                  {loading === 'monthly' ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner w-4 h-4"></div>
                      Loading...
                    </span>
                  ) : (
                    'Subscribe Monthly'
                  )}
                </button>
                <button
                  onClick={() => handleSubscribe('annual')}
                  disabled={loading !== null}
                  className="btn btn-secondary px-8"
                >
                  {loading === 'annual' ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner w-4 h-4"></div>
                      Loading...
                    </span>
                  ) : (
                    'Subscribe Annually'
                  )}
                </button>
              </div>

              {!session && (
                <p className="text-sm text-steel mt-4">
                  You&apos;ll be asked to sign in before checkout.
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-steel">
            Already a subscriber?{' '}
            <button
              onClick={handleManageSubscription}
              className="text-copper hover:underline"
              disabled={loading !== null}
            >
              Manage your subscription
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
