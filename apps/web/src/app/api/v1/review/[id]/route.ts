import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../server/auth/auth-service';
import { ReviewQueueService } from '../../../../../server/services/review-queue.service';
import { DomainError } from '../../../../../server/errors/domain-errors';
import { z } from 'zod';
import { RateLimiter } from '../../../../../server/utils/rate-limiter';
import { LoggerService } from '../../../../../server/services/logger.service';

const draftSchema = z.object({
  workingJson: z.object({
    title: z.string().optional(),
    durationMinutes: z.number().optional(),
    sections: z.array(z.any()).optional(),
  }).passthrough(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    const review = await ReviewQueueService.getReview(id, session.user.id, session.user.role);
    return NextResponse.json(review);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error fetching review', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    
    RateLimiter.check(`review_draft_save_${session.user.id}_${id}`, 30, 60000);

    const body = await req.json();
    const validatedData = draftSchema.parse(body);

    const review = await ReviewQueueService.saveDraft(id, session.user.id, session.user.role, validatedData.workingJson);
    return NextResponse.json(review);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    LoggerService.error('Unhandled error saving review draft', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
