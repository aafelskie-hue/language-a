'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BeachheadMark } from '@/components/shared/Logo';

export function Footer() {
  const { data: session, status } = useSession();

  return (
    <footer className="mt-auto pt-16 pb-8" role="contentinfo">
      <div className="max-w-page mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate/10">
          <p className="font-serif italic text-sm text-slate">
            Design patterns for enduring places.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/consult"
              className="text-copper hover:text-copper-dark transition-colors"
            >
              Pattern review consulting for real projects
            </Link>
            {status !== 'loading' && !session?.user && (
              <>
                <span className="text-slate/30">|</span>
                <Link
                  href="/auth/signin"
                  className="text-steel hover:text-charcoal transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <BeachheadMark variant="light" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
              A Beachhead Systems Product
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
