import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../server/auth/auth-service';
import { UploadService } from '../../../../server/services/upload.service';
import { DomainError } from '../../../../server/errors/domain-errors';

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAuth();
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadedFile = await UploadService.processUpload(
      session.user.id,
      buffer,
      file.name,
      file.type,
      'QUESTION_PAPER'
    );

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
