import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../server/auth/auth-service';
import { AttemptService } from '../../../../../../server/services/attempt.service';
import { DomainError } from '../../../../../../server/errors/domain-errors';
import { LoggerService } from '../../../../../../server/services/logger.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    const attempt = await AttemptService.startAttempt(id, session.user.id);
    LoggerService.info('Attempt started', { attemptId: attempt.id, examId: id, userId: session.user.id });
    return NextResponse.json(attempt);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error starting attempt', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
