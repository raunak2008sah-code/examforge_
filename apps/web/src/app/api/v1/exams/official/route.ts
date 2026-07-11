import { NextResponse } from 'next/server';
import { authService } from '@/server/auth/auth-service';
import { ExamService } from '@/server/services/exam.service';

export async function GET(req: Request) {
  try {
    await authService.requireAuth();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    const data = await ExamService.getOfficialExams(search, page);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
