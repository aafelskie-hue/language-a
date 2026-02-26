'use client';

import Link from 'next/link';

interface SignInGateProps {
  onDismiss: () => void;
}

export function SignInGate({ onDismiss }: SignInGateProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-card shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-charcoal mb-2">
          Sign in to create projects
        </h3>
        <p className="text-slate text-sm mb-6">
          Create a free profile to start building your pattern language — your
          projects and conversations will be saved across devices.
        </p>
        <div className="flex gap-3">
          <Link
            href="/auth/signin?callbackUrl=/projects"
            className="btn btn-primary flex-1 text-center"
          >
            Create Free Profile
          </Link>
          <button onClick={onDismiss} className="btn btn-secondary">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
