import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../server/auth/auth-service';
import { ParserJobService } from '../../../../../server/services/parser-job.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;

    const job = await ParserJobService.getJobStatus(id, session.user.id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('ParserJob GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
