'use client';

import Link from 'next/link';

interface GatePromptProps {
  onDismiss: () => void;
}

export function GatePrompt({ onDismiss }: GatePromptProps) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-copper-pale rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="flex-1 space-y-4">
        <p className="text-charcoal">
          You&apos;ve used your 5 free design sessions this month.
        </p>

        <p className="text-slate text-sm">
          Your sessions reset on the 1st.
        </p>

        <p className="text-slate text-sm">
          The Workshop — with unlimited design sessions — is coming soon.
          In the meantime, your free sessions reset on the 1st of each month.
        </p>

        <div className="flex gap-3 pt-2">
          <Link
            href="/workshop"
            className="btn btn-primary"
          >
            Learn more about The Workshop
          </Link>
          <button
            onClick={onDismiss}
            className="btn btn-secondary"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
