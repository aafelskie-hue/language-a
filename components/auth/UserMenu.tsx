'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

type UserWithTier = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  tier?: 'free' | 'premium';
};

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-steel/30 animate-pulse" />
    );
  }

  // Not logged in
  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="font-mono text-[11px] uppercase tracking-wider px-3 py-2 rounded-md transition-colors text-silver hover:text-white hover:bg-white/5 border border-steel/30"
      >
        Sign In
      </Link>
    );
  }

  // Logged in
  const user = session.user as UserWithTier;
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || '?';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-copper text-white text-xs font-medium hover:bg-copper-dark transition-colors focus:outline-none focus:ring-2 focus:ring-copper-light focus:ring-offset-2 focus:ring-offset-navy-deep"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-card shadow-lg border border-slate/10 py-2 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate/10">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-charcoal truncate">
                {user.name || 'User'}
              </p>
              {user.tier === 'premium' && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-copper/10 text-copper rounded">
                  Premium
                </span>
              )}
            </div>
            <p className="text-xs text-steel truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate hover:bg-cloud transition-colors"
              role="menuitem"
            >
              My Projects
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-slate/10 pt-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-sm text-slate hover:bg-cloud transition-colors"
              role="menuitem"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
