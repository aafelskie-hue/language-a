'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '@/store/useProjectStore';

export function ProjectSync() {
  const { data: session, status } = useSession();
  const {
    setAuthenticated,
    loadProjects,
    migrateLocalToCloud,
    isAuthenticated,
    migrationComplete,
  } = useProjectStore();

  const [notification, setNotification] = useState<string | null>(null);
  const previousAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    const isNowAuthenticated = !!session?.user;

    // Only run logic when auth state changes
    if (previousAuthState.current === isNowAuthenticated) return;
    previousAuthState.current = isNowAuthenticated;

    if (isNowAuthenticated && !isAuthenticated) {
      // User just logged in
      setAuthenticated(true);

      // Load cloud projects and handle migration
      const initializeProjects = async () => {
        // First check if there are local projects to migrate
        const migratedCount = await migrateLocalToCloud();

        if (migratedCount > 0) {
          setNotification(
            `${migratedCount} project${migratedCount === 1 ? '' : 's'} saved to your account`
          );
          setTimeout(() => setNotification(null), 4000);
        } else if (!migrationComplete) {
          // No local projects, just load from cloud
          await loadProjects();
        }
      };

      initializeProjects();
    } else if (!isNowAuthenticated && isAuthenticated) {
      // User just logged out
      setAuthenticated(false);
      // Projects will revert to localStorage mode automatically
    }
  }, [
    session,
    status,
    isAuthenticated,
    migrationComplete,
    setAuthenticated,
    loadProjects,
    migrateLocalToCloud,
  ]);

  if (!notification) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-charcoal text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <svg
        className="w-5 h-5 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-sm">{notification}</span>
    </div>
  );
}
