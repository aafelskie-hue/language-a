import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth';
import { kv, kvKeys, getISOWeekNumber } from '@/lib/kv';

const FREE_WEEKLY_LIMIT = 5;

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const weekId = getISOWeekNumber();
    const usageKey = kvKeys.userWeeklyUsage(user.id, weekId);
    const count = (await kv.get<number>(usageKey)) || 0;

    return NextResponse.json({
      count,
      limit: FREE_WEEKLY_LIMIT,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
