import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../server/auth/auth-service';
import { ReviewQueueService } from '../../../../server/services/review-queue.service';
import { DomainError } from '../../../../server/errors/domain-errors';

export async function GET(req: NextRequest) {
  try {
    const session = await authService.requireAuth();
    const reviews = await ReviewQueueService.getPendingReviews(session.user.id, session.user.role);
    return NextResponse.json(reviews);
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
