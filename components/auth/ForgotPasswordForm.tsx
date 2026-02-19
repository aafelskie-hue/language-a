'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setSubmitted(true);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-green-800 mb-2">Check your email</h2>
          <p className="text-sm text-green-700">
            If an account exists for {email}, you&apos;ll receive a password reset link shortly.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="text-sm text-copper hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-xl font-bold text-charcoal mb-2">Reset your password</h2>
      <p className="text-sm text-slate mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <span className="spinner" /> : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center">
        <Link href="/auth/signin" className="text-copper hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
