import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import { processConversations } from '@/lib/analytics/processor';

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();

  // Return 404 for non-admins (security through obscurity)
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const fullReprocess = body.fullReprocess === true;

    const result = await processConversations(fullReprocess);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Analytics processing error:', err);
    return NextResponse.json(
      { error: 'Processing failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
