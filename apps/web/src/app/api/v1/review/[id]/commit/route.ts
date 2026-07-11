import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../server/auth/auth-service';
import { ReviewQueueService } from '../../../../../../server/services/review-queue.service';
import { DomainError } from '../../../../../../server/errors/domain-errors';
import { z } from 'zod';
import { LoggerService } from '../../../../../../server/services/logger.service';

const commitSchema = z.object({
  isOfficial: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validatedData = commitSchema.parse(body);
    const isOfficial = !!validatedData.isOfficial;

    if (isOfficial && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can publish official exams' }, { status: 403 });
    }

    const exam = await ReviewQueueService.commitToExam(id, session.user.id, session.user.role, isOfficial);
    
    LoggerService.info('Review committed to Exam', { reviewId: id, examId: exam.id, isOfficial, userId: session.user.id });
    return NextResponse.json(exam);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error committing review', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
