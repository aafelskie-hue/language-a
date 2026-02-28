import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { db } from '@/lib/db';
import { projects, projectPatterns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  forbiddenResponse,
  verifyProjectOwnership,
} from '@/lib/api/auth';
import { buildPdfExportData } from '@/lib/exportPdf';
import { ProjectPdfDocument } from '@/lib/pdf/ProjectPdfDocument';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user.id);
  if (!project) return forbiddenResponse();

  // Fetch patterns from DB
  const patterns = await db
    .select()
    .from(projectPatterns)
    .where(eq(projectPatterns.projectId, id));

  const patternInput = patterns.map((p) => ({
    patternId: p.patternId,
    status: p.status,
    notes: p.notes ?? '',
  }));

  const pdfData = buildPdfExportData(
    project.name,
    project.description,
    patternInput
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(ProjectPdfDocument, { data: pdfData }) as any
  );

  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-language-a.pdf"`,
    },
  });
}
