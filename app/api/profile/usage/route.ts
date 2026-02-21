import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth';
import { kv, kvKeys, getMonthKey } from '@/lib/kv';

const FREE_MONTHLY_LIMIT = 5;

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const monthId = getMonthKey();
    const usageKey = kvKeys.userMonthlyUsage(user.id, monthId);
    const count = (await kv.get<number>(usageKey)) || 0;

    return NextResponse.json({
      count,
      limit: FREE_MONTHLY_LIMIT,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
