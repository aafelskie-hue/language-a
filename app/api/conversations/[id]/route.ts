import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, type ConversationMessage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

// GET /api/conversations/[id] - Get full conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    );

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages as ConversationMessage[],
    totalOutputTokens: conversation.totalOutputTokens,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  });
}

// PUT /api/conversations/[id] - Append messages to conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    );

  if (!existing) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { messages, outputTokens } = body as {
    messages?: ConversationMessage[];
    outputTokens?: number;
  };

  // Append new messages to existing
  const existingMessages = existing.messages as ConversationMessage[];
  const updatedMessages = messages
    ? [...existingMessages, ...messages]
    : existingMessages;

  // Update output tokens if provided
  const updatedOutputTokens = outputTokens
    ? existing.totalOutputTokens + outputTokens
    : existing.totalOutputTokens;

  const [updated] = await db
    .update(conversations)
    .set({
      messages: updatedMessages,
      totalOutputTokens: updatedOutputTokens,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    messages: updated.messages as ConversationMessage[],
    totalOutputTokens: updated.totalOutputTokens,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Verify ownership and delete
  const result = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
