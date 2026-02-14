import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Beachhead Foundation
        'navy-deep': '#0F1F33',
        'navy': '#1E3A5F',
        'charcoal': '#111827',
        'cloud': '#F3F4F6',
        'slate': '#374151',
        'steel': '#6B7280',
        'silver': '#9CA3AF',
        // Language A Accent — Copper
        'copper': '#B5734A',
        'copper-light': '#D4956A',
        'copper-dark': '#8B5A3A',
        'copper-muted': '#C49A7A',
        'copper-pale': '#F0E4DA',
        // App Surfaces
        'surface-warm': '#FAF7F4',
        'surface-card': '#FFFFFF',
        'surface-dark': '#0F1F33',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
        serif: ['var(--font-instrument-serif)', 'serif'],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'tighter': '-0.01em',
        'wide': '0.04em',
        'wider': '0.06em',
        'widest': '0.08em',
        'ultra': '0.1em',
      },
      maxWidth: {
        'content': '640px',
        'page': '1120px',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
