'use client';

import { BeachheadMark } from '@/components/shared/Logo';

export function Footer() {
  return (
    <footer className="mt-auto pt-16 pb-8" role="contentinfo">
      <div className="max-w-page mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate/10">
          <p className="font-serif italic text-sm text-slate">
            Design patterns for enduring places.
          </p>
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
