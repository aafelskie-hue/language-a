import { kv, kvKeys, getMonthKey } from '@/lib/kv';

// Limits
const ANONYMOUS_TOTAL_CONVERSATIONS = parseInt(
  process.env.GUIDE_ANONYMOUS_CONVERSATIONS || '2'
);
const FREE_CONVERSATIONS_PER_MONTH = parseInt(
  process.env.GUIDE_FREE_CONVERSATIONS_PER_MONTH || '5'
);
const MESSAGES_PER_CONVERSATION = parseInt(
  process.env.GUIDE_MESSAGES_PER_CONVERSATION || '10'
);
const MONTH_SECONDS = 31 * 24 * 60 * 60;

export type UserTier = 'anonymous' | 'free' | 'premium';

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'message_limit' | 'conversation_limit_anonymous' | 'conversation_limit_free';
  message?: string;
  remaining?: {
    conversations: number;
    messages: number;
  };
}

/**
 * Check rate limits based on user tier
 *
 * @param clientIP - Client IP address for anonymous users
 * @param messageCount - Number of messages already in the current conversation
 * @param userTier - 'anonymous', 'free', or 'premium'
 * @param userId - User ID (null for anonymous)
 * @param isNewConversation - Whether this is starting a new conversation
 */
export async function checkRateLimit(
  clientIP: string,
  messageCount: number,
  userTier: UserTier,
  userId: string | null,
  isNewConversation: boolean
): Promise<RateLimitResult> {
  // Premium users bypass all limits
  if (userTier === 'premium') {
    return { allowed: true };
  }

  // Per-conversation message limit applies to all non-premium users
  if (messageCount >= MESSAGES_PER_CONVERSATION) {
    return {
      allowed: false,
      reason: 'message_limit',
      message: `This conversation has reached the ${MESSAGES_PER_CONVERSATION}-message limit. Start a new conversation to continue.`,
    };
  }

  // Only check conversation limits when starting a new conversation
  if (isNewConversation) {
    if (userTier === 'anonymous') {
      // Anonymous: lifetime IP-based limit
      const key = kvKeys.ipUsage(clientIP);
      const count = (await kv.get<number>(key)) || 0;

      console.log('[Rate Limit] Anonymous check - key:', key, 'count:', count, 'limit:', ANONYMOUS_TOTAL_CONVERSATIONS);

      if (count >= ANONYMOUS_TOTAL_CONVERSATIONS) {
        console.log('[Rate Limit] Anonymous BLOCKED - limit reached');
        return {
          allowed: false,
          reason: 'conversation_limit_anonymous',
          message: "You've used your free preview conversations. Create a free profile to continue — your projects and conversations will be saved across devices.",
        };
      }

      return {
        allowed: true,
        remaining: {
          conversations: ANONYMOUS_TOTAL_CONVERSATIONS - count,
          messages: MESSAGES_PER_CONVERSATION - messageCount,
        },
      };
    }

    if (userTier === 'free' && userId) {
      // Free: monthly limit
      const monthId = getMonthKey();
      const key = kvKeys.userMonthlyUsage(userId, monthId);
      const count = (await kv.get<number>(key)) || 0;

      if (count >= FREE_CONVERSATIONS_PER_MONTH) {
        return {
          allowed: false,
          reason: 'conversation_limit_free',
          message: "You've reached this month's Guide limit (5 conversations). Your conversations reset on the 1st. All patterns, projects, and the network are still available.",
        };
      }

      return {
        allowed: true,
        remaining: {
          conversations: FREE_CONVERSATIONS_PER_MONTH - count,
          messages: MESSAGES_PER_CONVERSATION - messageCount,
        },
      };
    }
  }

  // Continuing an existing conversation (not a new one)
  return {
    allowed: true,
    remaining: {
      conversations: userTier === 'anonymous'
        ? ANONYMOUS_TOTAL_CONVERSATIONS
        : FREE_CONVERSATIONS_PER_MONTH,
      messages: MESSAGES_PER_CONVERSATION - messageCount,
    },
  };
}

/**
 * Record that a new conversation was started
 * Call this AFTER successfully creating a conversation
 */
export async function recordNewConversation(
  clientIP: string,
  userId: string | null
): Promise<void> {
  if (userId) {
    // Authenticated user - increment monthly count
    const monthId = getMonthKey();
    const key = kvKeys.userMonthlyUsage(userId, monthId);
    const newCount = await kv.incr(key);
    // Set expiry to 31 days (will auto-expire after the month)
    await kv.expire(key, MONTH_SECONDS);
    console.log('[Rate Limit] Recorded auth conversation - key:', key, 'newCount:', newCount);
  } else {
    // Anonymous - increment lifetime count (no expiry)
    const key = kvKeys.ipUsage(clientIP);
    const newCount = await kv.incr(key);
    console.log('[Rate Limit] Recorded anonymous conversation - key:', key, 'newCount:', newCount);
  }
}

/**
 * Get current usage stats (for debugging/monitoring)
 */
export async function getUsageStats(
  clientIP: string,
  userId: string | null
): Promise<{ conversationCount: number; monthId?: string }> {
  if (userId) {
    const monthId = getMonthKey();
    const key = kvKeys.userMonthlyUsage(userId, monthId);
    const count = (await kv.get<number>(key)) || 0;
    return { conversationCount: count, monthId };
  } else {
    const key = kvKeys.ipUsage(clientIP);
    const count = (await kv.get<number>(key)) || 0;
    return { conversationCount: count };
  }
}
