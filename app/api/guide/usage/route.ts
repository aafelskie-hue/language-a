import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUsageStats, type UserTier } from '@/lib/guide/rate-limit';

const ANONYMOUS_TOTAL_CONVERSATIONS = parseInt(
  process.env.GUIDE_ANONYMOUS_CONVERSATIONS || '2'
);
const FREE_CONVERSATIONS_PER_MONTH = parseInt(
  process.env.GUIDE_FREE_CONVERSATIONS_PER_MONTH || '5'
);

/**
 * Calculate the 1st of next month (monthly reset day)
 */
function getNextFirstOfMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const userTier: UserTier = userId
      ? ((session?.user as { tier?: string })?.tier === 'premium' ? 'premium' : 'free')
      : 'anonymous';

    // Premium users have unlimited usage
    if (userTier === 'premium') {
      return NextResponse.json({ tier: 'premium' });
    }

    // Get client IP for anonymous users
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIP = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    const stats = await getUsageStats(clientIP, userId);

    if (userTier === 'anonymous') {
      const limit = ANONYMOUS_TOTAL_CONVERSATIONS;
      const used = stats.conversationCount;
      return NextResponse.json({
        tier: 'anonymous',
        used,
        limit,
        remaining: Math.max(0, limit - used),
      });
    }

    // Free authenticated user
    const limit = FREE_CONVERSATIONS_PER_MONTH;
    const used = stats.conversationCount;
    return NextResponse.json({
      tier: 'free',
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetDay: getNextFirstOfMonth(),
    });
  } catch (error) {
    console.error('Guide usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
