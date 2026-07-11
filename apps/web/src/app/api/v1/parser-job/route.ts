import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../server/auth/auth-service';
import { ParserJobService } from '../../../../server/services/parser-job.service';
import { DomainError } from '../../../../server/errors/domain-errors';

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAuth();
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const job = await ParserJobService.createJob(session.user.id, fileId);

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error('ParserJob POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
