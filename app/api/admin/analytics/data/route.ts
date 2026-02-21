import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import { getDashboardData } from '@/lib/analytics/processor';

export async function GET() {
  const adminCheck = await requireAdmin();

  // Return 404 for non-admins (security through obscurity)
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Analytics data fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
