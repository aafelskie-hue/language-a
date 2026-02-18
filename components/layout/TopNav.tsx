'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { useState } from 'react';

const navLinks = [
  { href: '/patterns', label: 'Patterns' },
  { href: '/network', label: 'Network' },
  { href: '/projects', label: 'Projects' },
  { href: '/guide', label: 'Guide' },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/patterns') {
      return pathname.startsWith('/patterns');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-navy-deep sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-page mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Language A home">
            <Logo size="md" variant="light" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <span className="text-steel mx-3 select-none" aria-hidden="true">|</span>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono text-[11px] uppercase tracking-wider px-3 py-2 rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'text-copper-light'
                    : 'text-silver hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-silver hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div id="mobile-menu" className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block font-mono text-xs uppercase tracking-wider px-3 py-3 rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'text-copper-light bg-white/5'
                    : 'text-silver hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
