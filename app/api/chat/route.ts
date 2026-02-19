import { NextRequest, NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/guide/system-prompt';
import { checkRateLimit, recordNewConversation, type UserTier } from '@/lib/guide/rate-limit';
import { checkSpendLimit, estimateCost, recordUsage } from '@/lib/guide/spend-control';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { conversations, type ConversationMessage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GUIDE_API_KEY;

  try {
    // Get session for authenticated users
    const session = await auth();
    const userId = session?.user?.id || null;
    const userTier: UserTier = userId
      ? ((session?.user as { tier?: string })?.tier === 'premium' ? 'premium' : 'free')
      : 'anonymous';

    const body = await request.json();
    const {
      message,
      messages,
      projectPatternIds,
      conversationId,
      sessionId
    } = body as {
      message?: string;
      messages?: Message[];
      projectPatternIds?: number[];
      conversationId?: string;
      sessionId?: string;
    };

    // No API key = demo mode with mock responses
    if (!apiKey) {
      const userMessage = message || messages?.[messages.length - 1]?.content || '';
      return NextResponse.json({
        response: getMockResponse(userMessage),
        demo: true,
      });
    }

    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Determine message count for rate limiting
    let currentMessageCount = 0;
    let isNewConversation = false;
    let existingConversation: typeof conversations.$inferSelect | null = null;

    // Count messages being sent (for anonymous, this is how we detect new vs continuing)
    const incomingMessageCount = messages?.length || (message ? 1 : 0);

    if (conversationId && userId) {
      // Authenticated user with existing conversation
      const [conv] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, userId)
          )
        );

      if (conv) {
        existingConversation = conv;
        currentMessageCount = (conv.messages as ConversationMessage[]).length;
      }
    } else if (!conversationId && userId) {
      // Authenticated user starting new conversation
      isNewConversation = true;
    } else if (!userId) {
      // Anonymous user - new conversation if this is the first message (messages array has 1 item)
      isNewConversation = incomingMessageCount === 1;
      // For anonymous, message count is what client sends (ephemeral)
      currentMessageCount = incomingMessageCount > 0 ? incomingMessageCount - 1 : 0;
    }

    console.log('[Guide Rate Limit] IP:', clientIP, 'tier:', userTier, 'isNew:', isNewConversation, 'msgCount:', currentMessageCount);

    // --- Rate Limiting ---
    const rateLimitResult = await checkRateLimit(
      clientIP,
      currentMessageCount,
      userTier,
      userId,
      isNewConversation
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          reason: rateLimitResult.reason,
          message: rateLimitResult.message,
        },
        { status: 429 }
      );
    }

    // --- Spend Circuit Breaker ---
    const spendCheck = await checkSpendLimit();
    if (!spendCheck.allowed) {
      console.error('[Guide] Spend limit reached:', spendCheck);
      return NextResponse.json(
        {
          error: 'spend_limit',
          message: 'The AI Guide is taking a brief rest. All patterns, the network, and your projects are still available.',
        },
        { status: 503 }
      );
    }

    // --- Build Conversation ---
    const conversationMessages: Message[] = messages
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : message
        ? [{ role: 'user' as const, content: message }]
        : [];

    if (conversationMessages.length === 0) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // --- Call Anthropic API ---
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        system: getSystemPrompt(projectPatternIds),
        max_tokens: 2048,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');

    // --- Record Usage ---
    const cost = estimateCost(data.usage);
    await recordUsage(clientIP, sessionId || conversationId, cost);

    // --- Record New Conversation for Rate Limiting ---
    // For anonymous users, record when they start a new conversation
    if (isNewConversation && !userId) {
      console.log('[Guide Rate Limit] Recording new anonymous conversation for IP:', clientIP);
      await recordNewConversation(clientIP, null);
    }

    // --- Persist Conversation for Authenticated Users ---
    let resultConversationId = conversationId;

    if (userId) {
      const now = new Date().toISOString();
      const userMsg: ConversationMessage = {
        role: 'user',
        content: conversationMessages[conversationMessages.length - 1].content,
        timestamp: now,
      };
      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      };

      if (existingConversation) {
        // Append to existing conversation
        const existingMessages = existingConversation.messages as ConversationMessage[];
        await db
          .update(conversations)
          .set({
            messages: [...existingMessages, userMsg, assistantMsg],
            totalOutputTokens: existingConversation.totalOutputTokens + (data.usage?.output_tokens || 0),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, existingConversation.id));
      } else {
        // Create new conversation
        const firstUserMessage = conversationMessages[0].content;
        const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : '');

        const [newConv] = await db
          .insert(conversations)
          .values({
            userId,
            title,
            messages: [userMsg, assistantMsg],
            totalOutputTokens: data.usage?.output_tokens || 0,
          })
          .returning();

        resultConversationId = newConv.id;

        // Record the new conversation for rate limiting
        await recordNewConversation(clientIP, userId);
      }
    }

    return NextResponse.json({
      response: assistantMessage,
      conversationId: resultConversationId,
      usage: {
        conversationTurn: conversationMessages.length,
      },
      remaining: rateLimitResult.remaining,
    });

  } catch (error) {
    console.error('Guide API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock response for demo mode (no API key)
function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('cold') || lowerMessage.includes('winter') || lowerMessage.includes('edmonton') || lowerMessage.includes('northern')) {
    return `For cold-climate projects, I'd recommend starting with these key patterns:

**Pattern 58: The Winter City Street** — Design streets for the worst month, not the best. Orient pedestrian routes for maximum sun exposure in winter.

**Pattern 59: The Heated Threshold** — Create a proper vestibule (at least 3 square meters) with radiant floor heat, bench, and storage. This is essential at -30°C.

**Pattern 61: The Dark Season Room** — Designate one south-facing room with maximum winter solar gain and full-spectrum lighting. This addresses the psychological toll of northern winters.

**Pattern 63: The Covered Connection** — Between any two buildings used daily, provide covered, wind-protected walkways.

These patterns work together — the heated threshold (59) connects to the entrance sequence (35), and the dark season room (61) builds on south-facing living (38). Would you like me to explore the connections in more detail?`;
  }

  if (lowerMessage.includes('home office') || lowerMessage.includes('work from home') || lowerMessage.includes('remote work')) {
    return `For a successful home office setup, consider this sequence of patterns:

**Pattern 05: The Home Office Threshold** — The most critical pattern. Create a physical transition between workspace and living space — not just a door, but a change in level, light quality, or passage through a buffer space.

**Pattern 06: The Fifteen-Minute Shed** — If possible, a small separate structure within the property. Even 10 square meters, heated and insulated, transforms the work-from-home experience.

**Pattern 07: The Zoom Room** — A dedicated 2 square meter enclosure for video calls. Separate from the main office — the office is for thinking, the Zoom Room is for performing.

**Pattern 34: Light on Two Sides** — Give your workspace natural light from at least two directions. This affects mood, productivity, and circadian rhythm.

Start with Pattern 05 — the threshold is what makes the separation real. Do you have a specific space in mind?`;
  }

  if (lowerMessage.includes('renovation') || lowerMessage.includes('retrofit') || lowerMessage.includes('existing')) {
    return `For existing building renovations, these patterns are particularly relevant:

**Pattern 28: Heritage Retrofit** — Work from the inside and hidden surfaces. Insulate attic first, then basement, then interior walls. Never wrap the exterior of a building worth preserving.

**Pattern 49: The Repaired Building** — Design so layers are independent and accessible. Structure exposed or inspectable, mechanical systems in accessible chases.

**Pattern 27: Office-to-Housing Conversion** — If converting commercial space, the key move is carving light wells to bring daylight to deep floor plates.

**Pattern 47: Living Surfaces** — Choose materials that age well — wood, stone, tile, lime plaster. Avoid surfaces that peak on installation day.

What's the nature of your renovation — is it primarily energy performance, adapting to new uses, or restoring character?`;
  }

  if (lowerMessage.includes('neighbor') || lowerMessage.includes('community') || lowerMessage.includes('neighborhood')) {
    return `For neighborhood-scale thinking, start with these foundational patterns:

**Pattern 01: The Fifteen-Minute Neighborhood** — The primary test: can residents reach groceries, school, park, clinic, gathering place, and transit within fifteen minutes on foot or by bicycle?

**Pattern 41: The Identifiable Neighborhood** — Roughly 500 people — small enough that residents recognize each other, large enough to support a gathering place.

**Pattern 42: Common Ground** — Reserve at least 10% of land as collectively owned space — gardens, courtyards, playgrounds.

**Pattern 02: The Third Place Network** — Ensure at least five distinct third places serving different social functions — morning quiet, informal gathering, active socializing, creative work, intergenerational mixing.

These work together to create the social fabric that makes a neighborhood more than just houses. Which aspect interests you most?`;
  }

  // Default response
  return `Thank you for your question about pattern-based design. Language A contains 254 interconnected patterns across three scales: Neighborhood, Building, and Construction.

To give you specific guidance, it helps to know:
1. **Scale** — Are you working on a neighborhood, building, or construction detail?
2. **Climate** — Is this for a cold climate (northern winters), or somewhere milder?
3. **Context** — New construction, renovation, or planning?

Some good starting points:
- For any project: **Pattern 34: Light on Two Sides** and **Pattern 35: The Entrance Sequence**
- For cold climates: **Pattern 22: Building Envelope as Climate System** and **Pattern 59: The Heated Threshold**
- For housing: **Pattern 12: The Missing Middle** and **Pattern 14: The Multigenerational Suite**

What's the nature of your project?`;
}
