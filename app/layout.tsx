import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Language A — Design Patterns for Enduring Places',
    template: '%s | Language A',
  },
  description: '100 interconnected design patterns for neighborhoods, buildings, and construction. Grounded in the forces that don\'t change.',
  keywords: ['pattern language', 'architecture', 'design patterns', 'urban planning', 'housing', 'cold climate', 'enduring places'],
  authors: [{ name: 'Beachhead Systems' }],
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://language-a.com',
    siteName: 'Language A',
    title: 'Language A — Design Patterns for Enduring Places',
    description: '100 interconnected design patterns for neighborhoods, buildings, and construction. Grounded in the forces that don\'t change.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Language A — Design Patterns for Enduring Places',
    description: '100 interconnected design patterns for neighborhoods, buildings, and construction. Grounded in the forces that don\'t change.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <TopNav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
