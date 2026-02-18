import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectPatterns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  forbiddenResponse,
  verifyProjectOwnership,
} from '@/lib/api/auth';

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  const body = await request.json();
  const { name, description } = body;

  const updates: { name?: string; description?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }
    updates.name = name.trim();
  }

  if (description !== undefined) {
    updates.description = typeof description === 'string' ? description.trim() : '';
  }

  const [updatedProject] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, id))
    .returning();

  // Fetch patterns
  const patterns = await db
    .select()
    .from(projectPatterns)
    .where(eq(projectPatterns.projectId, id));

  return NextResponse.json({
    id: updatedProject.id,
    name: updatedProject.name,
    description: updatedProject.description,
    createdAt: updatedProject.createdAt.toISOString(),
    updatedAt: updatedProject.updatedAt.toISOString(),
    patterns: patterns.map((p) => ({
      patternId: p.patternId,
      status: p.status,
      notes: p.notes ?? '',
      addedAt: p.addedAt.toISOString(),
    })),
  });
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  // Cascade delete will handle projectPatterns
  await db.delete(projects).where(eq(projects.id, id));

  return NextResponse.json({ success: true });
}
