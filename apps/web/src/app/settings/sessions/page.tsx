import React from 'react';
import { authService } from '../../../server/auth/auth-service';
import { prisma } from '@examforge/db';
import { SessionsClient } from './SessionsClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Active Sessions - ExamForge',
};

export default async function SessionsPage() {
  const session = await authService.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch all active sessions for this user from the database
  const activeSessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      expiresAt: {
        gt: new Date(), // Only sessions that haven't expired
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      token: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
      updatedAt: true,
    }
  });

  return (
    <SessionsClient 
      sessions={activeSessions} 
      currentSessionToken={session.session.token} 
    />
  );
}
