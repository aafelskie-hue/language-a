import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectPatterns } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  forbiddenResponse,
  verifyProjectOwnership,
} from '@/lib/api/auth';

// PUT /api/projects/[id]/patterns/[patternId] - Update a pattern in a project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; patternId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id, patternId: patternIdStr } = await params;
  const patternId = parseInt(patternIdStr, 10);

  if (isNaN(patternId)) {
    return NextResponse.json(
      { error: 'Invalid patternId' },
      { status: 400 }
    );
  }

  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  const body = await request.json();
  const { status, notes } = body;

  const updates: { status?: 'not_started' | 'considering' | 'applied' | 'rejected'; notes?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (status !== undefined) {
    const validStatuses = ['not_started', 'considering', 'applied', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    updates.status = status;
  }

  if (notes !== undefined) {
    updates.notes = typeof notes === 'string' ? notes : null;
  }

  const [updatedPattern] = await db
    .update(projectPatterns)
    .set(updates)
    .where(
      and(
        eq(projectPatterns.projectId, id),
        eq(projectPatterns.patternId, patternId)
      )
    )
    .returning();

  if (!updatedPattern) {
    return NextResponse.json(
      { error: 'Pattern not found in project' },
      { status: 404 }
    );
  }

  // Update project's updatedAt
  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, id));

  return NextResponse.json({
    patternId: updatedPattern.patternId,
    status: updatedPattern.status,
    notes: updatedPattern.notes ?? '',
    addedAt: updatedPattern.addedAt.toISOString(),
  });
}

// DELETE /api/projects/[id]/patterns/[patternId] - Remove a pattern from a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; patternId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id, patternId: patternIdStr } = await params;
  const patternId = parseInt(patternIdStr, 10);

  if (isNaN(patternId)) {
    return NextResponse.json(
      { error: 'Invalid patternId' },
      { status: 400 }
    );
  }

  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  const result = await db
    .delete(projectPatterns)
    .where(
      and(
        eq(projectPatterns.projectId, id),
        eq(projectPatterns.patternId, patternId)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Pattern not found in project' },
      { status: 404 }
    );
  }

  // Update project's updatedAt
  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, id));

  return NextResponse.json({ success: true });
}
