'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Props {
  patternCount: number;
}

export function SaveProjectPrompt({ patternCount }: Props) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(true); // Default true to avoid flash

  useEffect(() => {
    setDismissed(sessionStorage.getItem('save-prompt-dismissed') === 'true');
  }, []);

  if (session?.user || patternCount < 3 || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('save-prompt-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-copper/5 border border-copper/20 rounded-card p-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm text-charcoal mb-3">
            Your project has {patternCount} patterns. Create a free profile to save it across devices and browsers.
          </p>
          <Link href="/auth/signin" className="btn btn-primary text-sm">
            Create Free Profile
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="text-steel hover:text-charcoal p-1 self-start"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
