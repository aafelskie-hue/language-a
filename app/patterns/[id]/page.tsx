import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { patterns, getPatternByReadingOrder } from '@/lib/patterns';
import { PatternDetail } from '@/components/patterns/PatternDetail';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  return patterns.map((pattern) => ({
    id: pattern.reading_order.toString(),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pattern = getPatternByReadingOrder(parseInt(params.id, 10));

  if (!pattern) {
    return {
      title: 'Pattern Not Found',
    };
  }

  const description = pattern.problem.length > 160
    ? pattern.problem.slice(0, 157) + '...'
    : pattern.problem;

  return {
    title: pattern.name,
    description,
    openGraph: {
      title: `${pattern.name} | Language A`,
      description,
      type: 'article',
    },
  };
}

export default function PatternPage({ params }: PageProps) {
  const pattern = getPatternByReadingOrder(parseInt(params.id, 10));

  if (!pattern) {
    notFound();
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
      <PatternDetail pattern={pattern} />
    </div>
  );
}
