// In-memory rate limiting store
// Acceptable for early traffic — resets on deploy
// Vercel serverless functions share memory within a single instance
// but not across instances. This means rate limiting is approximate,
// which is fine for the free tier. Premium tier will use persistent storage.

interface RateLimitEntry {
  conversationCount: number;  // conversations started this week
  messageCount: number;       // messages in current conversation
  weekStart: number;          // timestamp of current week window
  currentSessionId?: string;  // track which session is active
}

const store = new Map<string, RateLimitEntry>();

const FREE_CONVERSATIONS_PER_WEEK = parseInt(
  process.env.GUIDE_FREE_CONVERSATIONS_PER_WEEK || '5'
);
const FREE_MESSAGES_PER_CONVERSATION = parseInt(
  process.env.GUIDE_FREE_MESSAGES_PER_CONVERSATION || '10'
);

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  upgradeHint?: string;
  remaining?: {
    conversations: number;
    messages: number;
  };
}

export function checkRateLimit(
  clientIP: string,
  sessionId?: string
): RateLimitResult {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  let entry = store.get(clientIP);

  // Reset weekly window
  if (!entry || (now - entry.weekStart) > weekMs) {
    entry = {
      conversationCount: 0,
      messageCount: 0,
      weekStart: now,
      currentSessionId: sessionId
    };
    store.set(clientIP, entry);
  }

  // New session = new conversation
  if (sessionId && entry.currentSessionId !== sessionId) {
    entry.currentSessionId = sessionId;
    entry.messageCount = 0;

    // Check weekly conversation limit before starting new one
    if (entry.conversationCount >= FREE_CONVERSATIONS_PER_WEEK) {
      return {
        allowed: false,
        message: `You've used your ${FREE_CONVERSATIONS_PER_WEEK} free Pattern Guide conversations this week. The limit resets on Monday.`,
        upgradeHint: 'Premium members get unlimited conversations.'
      };
    }

    entry.conversationCount++;
  }

  // Check per-conversation message limit
  if (entry.messageCount >= FREE_MESSAGES_PER_CONVERSATION) {
    return {
      allowed: false,
      message: `This conversation has reached the ${FREE_MESSAGES_PER_CONVERSATION}-message limit. Start a new conversation to continue exploring.`,
    };
  }

  // Track message
  entry.messageCount++;

  return {
    allowed: true,
    remaining: {
      conversations: FREE_CONVERSATIONS_PER_WEEK - entry.conversationCount,
      messages: FREE_MESSAGES_PER_CONVERSATION - entry.messageCount,
    }
  };
}

// Reset a specific IP's limits (useful for testing)
export function resetRateLimit(clientIP: string): void {
  store.delete(clientIP);
}

// Get current usage stats for an IP (useful for debugging)
export function getRateLimitStats(clientIP: string): RateLimitEntry | undefined {
  return store.get(clientIP);
}
