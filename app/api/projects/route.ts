import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectPatterns } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  getAuthenticatedUser,
  unauthorizedResponse,
} from '@/lib/api/auth';

// GET /api/projects - List all projects for authenticated user
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  // Fetch patterns for each project
  const projectsWithPatterns = await Promise.all(
    userProjects.map(async (project) => {
      const patterns = await db
        .select()
        .from(projectPatterns)
        .where(eq(projectPatterns.projectId, project.id));

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        patterns: patterns.map((p) => ({
          patternId: p.patternId,
          status: p.status,
          notes: p.notes ?? '',
          addedAt: p.addedAt.toISOString(),
        })),
      };
    })
  );

  return NextResponse.json(projectsWithPatterns);
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { name, description = '', patterns = [] } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: name.trim(),
      description: description.trim(),
    })
    .returning();

  // Insert patterns if provided (for migration)
  if (Array.isArray(patterns) && patterns.length > 0) {
    await db.insert(projectPatterns).values(
      patterns.map((p: { patternId: number; status?: string; notes?: string; addedAt?: string }) => ({
        projectId: newProject.id,
        patternId: p.patternId,
        status: (p.status as 'not_started' | 'considering' | 'applied' | 'rejected') ?? 'not_started',
        notes: p.notes ?? null,
        addedAt: p.addedAt ? new Date(p.addedAt) : new Date(),
      }))
    );
  }

  // Fetch the patterns we just inserted
  const insertedPatterns = await db
    .select()
    .from(projectPatterns)
    .where(eq(projectPatterns.projectId, newProject.id));

  return NextResponse.json({
    id: newProject.id,
    name: newProject.name,
    description: newProject.description,
    createdAt: newProject.createdAt.toISOString(),
    updatedAt: newProject.updatedAt.toISOString(),
    patterns: insertedPatterns.map((p) => ({
      patternId: p.patternId,
      status: p.status,
      notes: p.notes ?? '',
      addedAt: p.addedAt.toISOString(),
    })),
  }, { status: 201 });
}
