import { NextResponse } from 'next/server';
import { authService } from '@/server/auth/auth-service';
import { ExamService } from '@/server/services/exam.service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await authService.requireAuth();
    const resolvedParams = await params;
    
    const isSaved = await ExamService.toggleSave(session.user.id, resolvedParams.id);
    return NextResponse.json({ saved: isSaved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
