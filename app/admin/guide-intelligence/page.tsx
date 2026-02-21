import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/api/admin';
import { GuideIntelligenceDashboard } from '@/components/admin/GuideIntelligenceDashboard';

export const metadata = {
  title: 'Guide Intelligence',
  description: 'Analytics dashboard for Guide conversations',
};

export default async function GuideIntelligencePage() {
  const adminCheck = await requireAdmin();

  if (!adminCheck.authorized) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-1">
          Admin
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal">
          Guide Intelligence
        </h1>
        <p className="text-slate mt-2">
          Analytics extracted from Guide conversations
        </p>
      </header>

      <GuideIntelligenceDashboard />
    </div>
  );
}
