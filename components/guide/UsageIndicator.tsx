'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageData {
  tier: 'anonymous' | 'free' | 'premium';
  used?: number;
  limit?: number;
  remaining?: number;
  resetDay?: string;
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/guide/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsage();
  }, []);

  // Don't show anything while loading or for premium users
  if (isLoading || !usage || usage.tier === 'premium') {
    return null;
  }

  const isExhausted = usage.remaining === 0;

  // Exhausted state - prominent warning
  if (isExhausted) {
    if (usage.tier === 'anonymous') {
      return (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Create a free profile to continue using the Guide — your projects and conversations will be saved across devices.{' '}
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent('/guide')}`}
              className="text-copper font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      );
    }

    // Free user exhausted
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          You&apos;ve reached your 5 conversations for this week. Resets {usage.resetDay}.
        </p>
      </div>
    );
  }

  // Normal state - subtle indicator
  if (usage.tier === 'anonymous') {
    return (
      <p className="text-xs text-steel mb-4">
        {usage.remaining} conversation{usage.remaining !== 1 ? 's' : ''} remaining{' '}
        <span className="text-slate/50">·</span>{' '}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent('/guide')}`}
          className="text-copper hover:underline"
        >
          Sign in
        </Link>{' '}
        for 5 per week
      </p>
    );
  }

  // Free authenticated user
  return (
    <p className="text-xs text-steel mb-4">
      {usage.used} of {usage.limit} conversations used this week{' '}
      <span className="text-slate/50">·</span>{' '}
      Resets {usage.resetDay}
    </p>
  );
}
