import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pattern not found',
  description: 'This pattern does not exist in Language A',
};

export default function NotFound() {
  return (
    <div className="bg-surface-warm min-h-[calc(100vh-8rem)]">
      <div className="max-w-page mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-6">
            Pattern not found.
          </h1>
          <p className="text-slate leading-relaxed mb-8">
            Every network has its edges. This one doesn&apos;t exist —
            but 254 others do.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/patterns"
              className="text-copper hover:underline"
            >
              Browse all patterns &rarr;
            </Link>
            <Link
              href="/"
              className="text-copper hover:underline"
            >
              Go home &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
