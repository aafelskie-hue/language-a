import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Pattern Guide',
  description: 'A design partner that reads every pattern it recommends. Describe your project, explore the language, or ask what the patterns actually say.',
  openGraph: {
    title: 'AI Pattern Guide | Language A',
    description: 'A design partner that reads every pattern it recommends. Describe your project, explore the language, or ask what the patterns actually say.',
    images: ['https://language-a.com/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Pattern Guide | Language A',
    description: 'A design partner that reads every pattern it recommends. Describe your project, explore the language, or ask what the patterns actually say.',
    images: ['https://language-a.com/api/og'],
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
