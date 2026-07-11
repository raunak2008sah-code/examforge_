import { NextResponse } from 'next/server';
import { prisma } from '@examforge/db';
import { LoggerService } from '@/server/services/logger.service';

export async function GET() {
  try {
    // Basic liveness check is just reaching this code
    // Readiness check involves checking the database
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { status: 'ok', database: 'connected' },
      { status: 200 }
    );
  } catch (error) {
    LoggerService.error('Health check failed', { error });
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 503 }
    );
  }
}
