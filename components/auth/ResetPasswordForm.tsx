'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">Invalid Link</h2>
          <p className="text-sm text-red-700">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-copper hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-green-800 mb-2">Password Reset</h2>
          <p className="text-sm text-green-700">
            Your password has been reset successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-xl font-bold text-charcoal mb-2">Set new password</h2>
      <p className="text-sm text-slate mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5"
          >
            New Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full"
            placeholder="Confirm your password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {loading ? <span className="spinner" /> : 'Reset Password'}
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
