'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface ProfileUser {
  id: string;
  name: string | null;
  email: string | null;
  tier: 'free' | 'premium';
  provider: 'credentials' | 'google';
  createdAt: string;
}

interface Props {
  user: ProfileUser;
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleManageSubscription}
        disabled={loading}
        className="btn btn-secondary"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="spinner w-4 h-4" />
            Loading...
          </span>
        ) : (
          'Manage Subscription'
        )}
      </button>
    </div>
  );
}

export function ProfileContent({ user }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/profile/usage');
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch {
        // Silent fail - usage display is not critical
      } finally {
        setUsageLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account');
        return;
      }

      // Sign out and redirect
      await signOut({ callbackUrl: '/' });
    } catch {
      setDeleteError('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Account</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
              Name
            </dt>
            <dd className="text-charcoal">{user.name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
              Email
            </dt>
            <dd className="text-charcoal">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
              Account Type
            </dt>
            <dd className="flex items-center gap-2">
              <span className="text-charcoal capitalize">{user.tier}</span>
              {user.tier === 'premium' ? (
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-copper/10 text-copper rounded">
                  Premium
                </span>
              ) : (
                <Link href="/premium" className="text-sm text-copper hover:underline ml-2">
                  Upgrade to Premium
                </Link>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
              Sign-in Method
            </dt>
            <dd className="text-charcoal capitalize">{user.provider === 'google' ? 'Google' : 'Email & Password'}</dd>
          </div>
          <div>
            <dt className="text-xs font-mono uppercase tracking-wider text-steel mb-1">
              Member Since
            </dt>
            <dd className="text-charcoal">{memberSince}</dd>
          </div>
        </dl>
      </div>

      {/* Usage Card - only show for free users */}
      {user.tier === 'free' && (
        <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Usage</h2>
          {usageLoading ? (
            <div className="flex items-center gap-2 text-steel">
              <span className="spinner" />
              <span className="text-sm">Loading usage...</span>
            </div>
          ) : usage ? (
            <div>
              <p className="text-charcoal">
                <span className="font-mono text-lg">{usage.count}</span> of{' '}
                <span className="font-mono text-lg">{usage.limit}</span> Guide conversations this month
              </p>
              <div className="mt-2 h-2 bg-slate/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-copper transition-all"
                  style={{ width: `${Math.min(100, (usage.count / usage.limit) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-steel mt-2">Resets on the 1st of each month</p>
            </div>
          ) : (
            <p className="text-slate text-sm">Unable to load usage data</p>
          )}
        </div>
      )}

      {/* Subscription Card - only show for premium users */}
      {user.tier === 'premium' && (
        <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Subscription</h2>
          <p className="text-slate mb-4">
            You have unlimited access to the AI Pattern Guide.
          </p>
          <ManageSubscriptionButton />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full btn btn-secondary py-3"
        >
          Sign Out
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-card shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-charcoal mb-2">Delete Account</h3>
            <p className="text-slate text-sm mb-4">
              This action cannot be undone. All your projects, patterns, and conversations will be permanently deleted.
            </p>

            <div className="mb-4">
              <label
                htmlFor="deleteConfirmation"
                className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5"
              >
                Type DELETE to confirm
              </label>
              <input
                type="text"
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full"
                placeholder="DELETE"
              />
            </div>

            {deleteError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? <span className="spinner" /> : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
