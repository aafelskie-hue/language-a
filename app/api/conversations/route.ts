import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, type ConversationMessage } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { recordNewConversation, checkRateLimit, type UserTier } from '@/lib/guide/rate-limit';

// GET /api/conversations - List all conversations for authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt));

  const result = userConversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    messageCount: (conv.messages as ConversationMessage[]).length,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  }));

  return NextResponse.json(result);
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userTier: UserTier = (session.user as { tier?: string }).tier === 'premium' ? 'premium' : 'free';

  // Check rate limit before creating conversation
  const rateLimitResult = await checkRateLimit(
    clientIP,
    0, // No messages yet
    userTier,
    session.user.id,
    true // This is a new conversation
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

  const body = await request.json();
  const { firstMessage } = body as { firstMessage?: string };

  // Generate title from first message or default
  const title = firstMessage
    ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    : 'New conversation';

  const [newConversation] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title,
      messages: [],
      totalOutputTokens: 0,
    })
    .returning();

  // Record the new conversation for rate limiting
  await recordNewConversation(clientIP, session.user.id);

  return NextResponse.json({
    id: newConversation.id,
    title: newConversation.title,
    messages: [],
    createdAt: newConversation.createdAt.toISOString(),
    updatedAt: newConversation.updatedAt.toISOString(),
  }, { status: 201 });
}
