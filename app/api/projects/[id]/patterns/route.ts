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

// POST /api/projects/[id]/patterns - Add a pattern to a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  const body = await request.json();
  const { patternId, status = 'not_started', notes = '' } = body;

  if (typeof patternId !== 'number') {
    return NextResponse.json(
      { error: 'patternId must be a number' },
      { status: 400 }
    );
  }

  // Check if pattern already exists in project
  const existing = await db
    .select()
    .from(projectPatterns)
    .where(
      and(
        eq(projectPatterns.projectId, id),
        eq(projectPatterns.patternId, patternId)
      )
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Pattern already exists in project' },
      { status: 409 }
    );
  }

  const [newPattern] = await db
    .insert(projectPatterns)
    .values({
      projectId: id,
      patternId,
      status: status as 'not_started' | 'considering' | 'applied' | 'rejected',
      notes: notes || null,
    })
    .returning();

  // Update project's updatedAt
  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, id));

  return NextResponse.json({
    patternId: newPattern.patternId,
    status: newPattern.status,
    notes: newPattern.notes ?? '',
    addedAt: newPattern.addedAt.toISOString(),
  }, { status: 201 });
}
