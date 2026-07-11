import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../server/auth/auth-service';
import { UploadService } from '../../../../../server/services/upload.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authService.requireAuth();
    const { id } = await params;
    
    const file = await UploadService.getUploadDetails(id, session.user.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error: any) {
    console.error('Upload GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
