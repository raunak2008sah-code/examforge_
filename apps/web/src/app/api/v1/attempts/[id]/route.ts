import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../server/auth/auth-service';
import { AttemptService } from '../../../../../server/services/attempt.service';
import { DomainError } from '../../../../../server/errors/domain-errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    const attempt = await AttemptService.getAttempt(id, session.user.id);
    return NextResponse.json({ ...attempt, serverTime: Date.now() });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
