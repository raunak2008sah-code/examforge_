import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../server/auth/auth-service';
import { AttemptService } from '../../../../../../server/services/attempt.service';
import { DomainError } from '../../../../../../server/errors/domain-errors';
import { z } from 'zod';
import { LoggerService } from '../../../../../../server/services/logger.service';

const submitSchema = z.object({
  isAutoSubmit: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validatedData = submitSchema.parse(body);
    
    LoggerService.info('Attempt submitted', { attemptId: id, userId: session.user.id, autoSubmit: validatedData.isAutoSubmit });
    const attempt = await AttemptService.submitAttempt(id, session.user.id, !!validatedData.isAutoSubmit);
    return NextResponse.json(attempt);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error submitting attempt', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
