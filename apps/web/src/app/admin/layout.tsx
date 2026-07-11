import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { auth } from '@/server/auth/auth';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect('/login');
  }

  const user = {
    email: session.user.email,
    role: (session.user as { role?: string }).role || 'ADMIN', // Fallback until types are strictly enforced if needed
  };

  return <AdminLayout user={user}>{children}</AdminLayout>;
}
