import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../server/auth/auth-service';
import { AttemptService } from '../../../../../../server/services/attempt.service';
import { DomainError } from '../../../../../../server/errors/domain-errors';
import { z } from 'zod';
import { RateLimiter } from '../../../../../../server/utils/rate-limiter';
import { LoggerService } from '../../../../../../server/services/logger.service';

const responseSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().nullable().optional(),
  markedForReview: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    
    // Limit to 60 saves per minute per attempt
    RateLimiter.check(`attempt_save_${session.user.id}_${id}`, 60, 60000);

    const body = await req.json();
    const validatedData = responseSchema.parse(body);
    
    const response = await AttemptService.saveResponse(
      id, 
      session.user.id, 
      validatedData.questionId, 
      validatedData.selectedOptionId || null, 
      !!validatedData.markedForReview
    );
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      LoggerService.warn('Validation error on response save', { errors: error.issues });
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error saving response', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
